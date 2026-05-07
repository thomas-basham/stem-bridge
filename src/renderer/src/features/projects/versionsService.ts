import type {
  DesktopCachedUploadFile,
  DesktopQueuedFileUploadPayload,
  DesktopQueuedVersionCreatePayload,
} from '@shared/types';
import { projectsApi, versionsApi } from '@/lib/api';
import { getStoredUser } from '@/lib/auth-storage';
import {
  desktopSnapshotKeys,
  enqueueDesktopQueueItem,
  importDesktopUploadFile,
  isLikelyNetworkError,
  readDesktopCachedFile,
  readDesktopSnapshot,
  saveDesktopSnapshot,
} from '@/lib/desktop';
import type {
  SongVersion,
  VersionFileAsset,
  VersionFileAssetType,
} from '@/types/api';
import { mockVersionsByProjectId, shouldUseMockProjectData, wait } from './mockProjectData';
import { toProjectBlobServiceError, toProjectServiceError } from './project-service-error';

const mockUploadedFileBlobs = new Map<string, Blob>();
const downloadSizeToleranceBytes = 1024;
const localVersionIdPrefix = 'local-version-';
const localFileIdPrefix = 'local-file-';
const desktopCacheStorageKeyPrefix = 'desktop-cache:';

const formatBytes = (sizeBytes: number): string => {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
};

const assertCompleteDownload = (blob: Blob, fileAsset: VersionFileAsset, fileName: string): void => {
  if (fileAsset.sizeBytes <= 0 || blob.size <= 0) {
    return;
  }

  const sizeDifference = Math.abs(blob.size - fileAsset.sizeBytes);

  if (sizeDifference <= downloadSizeToleranceBytes) {
    return;
  }

  throw new Error(
    `Downloaded ${fileName} is incomplete or corrupted. Expected ${formatBytes(
      fileAsset.sizeBytes,
    )}, received ${formatBytes(blob.size)}.`,
  );
};

const getMockVersionById = (versionId: string): SongVersion | null => {
  for (const versions of Object.values(mockVersionsByProjectId)) {
    const version = versions.find((candidate) => candidate.id === versionId);

    if (version) {
      return version;
    }
  }

  return null;
};

const getCurrentUser = (): SongVersion['createdBy'] => {
  return (
    getStoredUser() ?? {
      id: 'local-current-user',
      email: 'offline@stembridge.local',
      name: 'Offline User',
    }
  );
};

const isLocalVersionId = (versionId: string): boolean => {
  return versionId.startsWith(localVersionIdPrefix);
};

const getCachedFileIdFromStorageKey = (storageKey: string): string | null => {
  return storageKey.startsWith(desktopCacheStorageKeyPrefix)
    ? storageKey.slice(desktopCacheStorageKeyPrefix.length)
    : null;
};

const copyBytesToArrayBuffer = (data: Uint8Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  return buffer;
};

const saveVersionSnapshots = async (projectId: string, versions: SongVersion[]): Promise<void> => {
  await saveDesktopSnapshot(desktopSnapshotKeys.versions(projectId), versions);
  await Promise.all(
    versions.map((version) => saveDesktopSnapshot(desktopSnapshotKeys.version(version.id), version)),
  );
};

const mergePendingLocalVersions = async (
  projectId: string,
  remoteVersions: SongVersion[],
): Promise<SongVersion[]> => {
  const cachedVersions = await readDesktopSnapshot<SongVersion[]>(
    desktopSnapshotKeys.versions(projectId),
  );
  const localVersions =
    cachedVersions?.data.filter((version) => isLocalVersionId(version.id)) ?? [];

  return [...localVersions, ...remoteVersions];
};

const upsertCachedVersion = async (version: SongVersion): Promise<void> => {
  const cachedVersions = await readDesktopSnapshot<SongVersion[]>(
    desktopSnapshotKeys.versions(version.projectId),
  );
  const nextVersions = [version, ...(cachedVersions?.data ?? []).filter((item) => item.id !== version.id)];

  await saveVersionSnapshots(version.projectId, nextVersions);
};

const appendCachedFileAsset = async (
  projectId: string,
  versionId: string,
  fileAsset: VersionFileAsset,
): Promise<void> => {
  const cachedVersion = await readDesktopSnapshot<SongVersion>(desktopSnapshotKeys.version(versionId));

  if (cachedVersion) {
    const nextVersion: SongVersion = {
      ...cachedVersion.data,
      fileAssetCount: (cachedVersion.data.fileAssetCount ?? 0) + 1,
      fileAssets: [...(cachedVersion.data.fileAssets ?? []), fileAsset],
    };
    await upsertCachedVersion(nextVersion);
    return;
  }

  const cachedVersions = await readDesktopSnapshot<SongVersion[]>(
    desktopSnapshotKeys.versions(projectId),
  );

  if (!cachedVersions) {
    return;
  }

  const nextVersions = cachedVersions.data.map((version) => {
    if (version.id !== versionId) {
      return version;
    }

    return {
      ...version,
      fileAssetCount: (version.fileAssetCount ?? 0) + 1,
      fileAssets: [...(version.fileAssets ?? []), fileAsset],
    };
  });

  await saveVersionSnapshots(projectId, nextVersions);
};

const createLocalFileAsset = (
  versionId: string,
  cachedFile: DesktopCachedUploadFile,
  type: VersionFileAssetType,
): VersionFileAsset => {
  return {
    id: `${localFileIdPrefix}${window.crypto.randomUUID()}`,
    versionId,
    name: cachedFile.fileName,
    originalName: cachedFile.fileName,
    type,
    mimeType: cachedFile.mimeType || 'application/octet-stream',
    sizeBytes: cachedFile.sizeBytes,
    storageKey: `${desktopCacheStorageKeyPrefix}${cachedFile.id}`,
    url: '',
    createdAt: new Date().toISOString(),
  };
};

const queueLocalFileUpload = async (params: {
  projectId: string;
  versionId: string;
  localVersionId?: string;
  cachedFile: DesktopCachedUploadFile;
  type: VersionFileAssetType;
}): Promise<void> => {
  const payload: DesktopQueuedFileUploadPayload = {
    projectId: params.projectId,
    versionId: params.localVersionId ? undefined : params.versionId,
    localVersionId: params.localVersionId,
    cachedFileId: params.cachedFile.id,
    fileName: params.cachedFile.fileName,
    mimeType: params.cachedFile.mimeType,
    sizeBytes: params.cachedFile.sizeBytes,
    fileType: params.type,
  };

  await enqueueDesktopQueueItem('file-upload', payload);
};

export const versionsService = {
  async list(projectId: string): Promise<SongVersion[]> {
    if (shouldUseMockProjectData) {
      await wait(220);
      return mockVersionsByProjectId[projectId] ?? [];
    }

    try {
      const remoteVersions = await projectsApi.versions(projectId);
      const versions = await mergePendingLocalVersions(projectId, remoteVersions);
      void saveVersionSnapshots(projectId, versions);
      return versions;
    } catch (error: unknown) {
      if (isLikelyNetworkError(error)) {
        const cachedVersions = await readDesktopSnapshot<SongVersion[]>(
          desktopSnapshotKeys.versions(projectId),
        );

        if (cachedVersions) {
          return cachedVersions.data;
        }
      }

      throw toProjectServiceError(error, 'Unable to load versions.');
    }
  },

  async getById(versionId: string): Promise<SongVersion> {
    if (shouldUseMockProjectData) {
      await wait(180);
      const version = getMockVersionById(versionId);

      if (!version) {
        throw new Error('Unable to load version.');
      }

      return version;
    }

    try {
      const version = await versionsApi.getById(versionId);
      void saveDesktopSnapshot(desktopSnapshotKeys.version(versionId), version);
      return version;
    } catch (error: unknown) {
      if (isLikelyNetworkError(error) || isLocalVersionId(versionId)) {
        const cachedVersion = await readDesktopSnapshot<SongVersion>(
          desktopSnapshotKeys.version(versionId),
        );

        if (cachedVersion) {
          return cachedVersion.data;
        }
      }

      throw toProjectServiceError(error, 'Unable to load version.');
    }
  },

  async create(projectId: string, payload: { notes?: string }): Promise<SongVersion> {
    if (shouldUseMockProjectData) {
      await wait(180);

      const versions = mockVersionsByProjectId[projectId] ?? [];
      const version: SongVersion = {
        id: window.crypto.randomUUID(),
        projectId,
        versionNumber: (versions[0]?.versionNumber ?? 0) + 1,
        notes: payload.notes,
        createdAt: new Date().toISOString(),
        createdBy: {
          id: 'mock-current-user',
          email: 'producer@stembridge.app',
          name: 'Producer',
        },
        fileAssetCount: 0,
        commentCount: 0,
        fileAssets: [],
        comments: [],
      };

      mockVersionsByProjectId[projectId] = [version, ...versions];
      return version;
    }

    try {
      const version = await projectsApi.createVersion(projectId, payload);
      await upsertCachedVersion(version);
      return version;
    } catch (error: unknown) {
      if (isLikelyNetworkError(error)) {
        const cachedVersions = await readDesktopSnapshot<SongVersion[]>(
          desktopSnapshotKeys.versions(projectId),
        );
        const nextVersionNumber =
          Math.max(0, ...(cachedVersions?.data.map((version) => version.versionNumber) ?? [])) + 1;
        const localVersion: SongVersion = {
          id: `${localVersionIdPrefix}${window.crypto.randomUUID()}`,
          projectId,
          versionNumber: nextVersionNumber,
          notes: payload.notes,
          createdAt: new Date().toISOString(),
          createdBy: getCurrentUser(),
          fileAssetCount: 0,
          commentCount: 0,
          fileAssets: [],
          comments: [],
        };
        const queuePayload: DesktopQueuedVersionCreatePayload = {
          projectId,
          localVersionId: localVersion.id,
          notes: payload.notes,
        };
        const queuedItem = await enqueueDesktopQueueItem('version-create', queuePayload);

        if (!queuedItem) {
          throw toProjectServiceError(error, 'Unable to create version.');
        }

        await upsertCachedVersion(localVersion);
        return localVersion;
      }

      throw toProjectServiceError(error, 'Unable to create version.');
    }
  },

  async uploadFile(params: {
    versionId: string;
    file: File;
    cachedFile?: DesktopCachedUploadFile;
    type: VersionFileAssetType;
    onProgress?: (progress: number) => void;
  }): Promise<VersionFileAsset> {
    if (shouldUseMockProjectData) {
      for (const progress of [20, 48, 76, 100]) {
        await wait(80);
        params.onProgress?.(progress);
      }

      const fileAsset: VersionFileAsset = {
        id: window.crypto.randomUUID(),
        versionId: params.versionId,
        name: params.file.name,
        originalName: params.file.name,
        type: params.type,
        mimeType: params.file.type || 'application/octet-stream',
        sizeBytes: params.file.size,
        storageKey: `mock/${params.versionId}/${params.file.name}`,
        url: '',
        createdAt: new Date().toISOString(),
      };

      mockUploadedFileBlobs.set(fileAsset.id, params.file);

      for (const versions of Object.values(mockVersionsByProjectId)) {
        const version = versions.find((candidate) => candidate.id === params.versionId);

        if (version) {
          version.fileAssetCount = (version.fileAssetCount ?? 0) + 1;
          version.fileAssets = [...(version.fileAssets ?? []), fileAsset];
          break;
        }
      }

      return fileAsset;
    }

    const projectId = await (async (): Promise<string | null> => {
      const cachedVersion = await readDesktopSnapshot<SongVersion>(
        desktopSnapshotKeys.version(params.versionId),
      );
      return cachedVersion?.data.projectId ?? null;
    })();

    if (isLocalVersionId(params.versionId)) {
      const cachedFile = params.cachedFile ?? (await importDesktopUploadFile(params.file));

      if (!projectId || !cachedFile) {
        throw new Error(`Unable to queue ${params.file.name} for upload.`);
      }

      await queueLocalFileUpload({
        projectId,
        versionId: params.versionId,
        localVersionId: params.versionId,
        cachedFile,
        type: params.type,
      });

      const localFileAsset = createLocalFileAsset(params.versionId, cachedFile, params.type);
      await appendCachedFileAsset(projectId, params.versionId, localFileAsset);
      params.onProgress?.(100);
      return localFileAsset;
    }

    try {
      const fileAsset = await versionsApi.uploadFile(params.versionId, {
        file: params.file,
        type: params.type,
        onProgress: params.onProgress,
      });
      return fileAsset;
    } catch (error: unknown) {
      if (isLikelyNetworkError(error)) {
        const cachedFile = params.cachedFile ?? (await importDesktopUploadFile(params.file));

        if (projectId && cachedFile) {
          await queueLocalFileUpload({
            projectId,
            versionId: params.versionId,
            cachedFile,
            type: params.type,
          });

          const localFileAsset = createLocalFileAsset(params.versionId, cachedFile, params.type);
          await appendCachedFileAsset(projectId, params.versionId, localFileAsset);
          params.onProgress?.(100);
          return localFileAsset;
        }
      }

      throw toProjectServiceError(error, `Unable to upload ${params.file.name}.`);
    }
  },

  async downloadFile(params: {
    versionId: string;
    fileAsset: VersionFileAsset;
  }): Promise<{ blob: Blob; fileName: string }> {
    if (shouldUseMockProjectData) {
      await wait(120);
      const uploadedBlob = mockUploadedFileBlobs.get(params.fileAsset.id);

      if (!uploadedBlob) {
        throw new Error(`Mock download unavailable for ${params.fileAsset.name}.`);
      }

      return {
        blob: uploadedBlob,
        fileName: params.fileAsset.originalName || params.fileAsset.name,
      };
    }

    const cachedFileId = getCachedFileIdFromStorageKey(params.fileAsset.storageKey);

    if (cachedFileId) {
      const cachedFile = await readDesktopCachedFile(cachedFileId);
      return {
        blob: new Blob([copyBytesToArrayBuffer(cachedFile.data)], {
          type: cachedFile.mimeType || params.fileAsset.mimeType || 'application/octet-stream',
        }),
        fileName: cachedFile.fileName,
      };
    }

    try {
      const result = await versionsApi.downloadFile(params.versionId, params.fileAsset.id);
      const fallbackFileName = params.fileAsset.originalName || params.fileAsset.name;
      const fileName =
        result.fileName && result.fileName !== 'download' ? result.fileName : fallbackFileName;

      assertCompleteDownload(result.blob, params.fileAsset, fileName);
      return {
        blob: result.blob,
        fileName,
      };
    } catch (error: unknown) {
      throw toProjectServiceError(error, `Unable to download ${params.fileAsset.name}.`);
    }
  },

  async downloadVersionZip(versionId: string): Promise<{ blob: Blob; fileName: string }> {
    if (shouldUseMockProjectData) {
      await wait(160);
      const version = getMockVersionById(versionId);

      if (!version) {
        throw new Error('Unable to download version.');
      }

      return {
        blob: new Blob([`Mock ZIP package for version ${version.versionNumber}`], {
          type: 'application/zip',
        }),
        fileName: `version-${version.versionNumber}.zip`,
      };
    }

    try {
      return await versionsApi.downloadVersionZip(versionId);
    } catch (error: unknown) {
      throw await toProjectBlobServiceError(error, 'Unable to download version ZIP.');
    }
  },
};
