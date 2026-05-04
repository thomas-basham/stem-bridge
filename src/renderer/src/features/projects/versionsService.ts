import { projectsApi, versionsApi } from '@/lib/api';
import type {
  SongVersion,
  VersionFileAsset,
  VersionFileAssetType,
} from '@/types/api';
import { mockVersionsByProjectId, shouldUseMockProjectData, wait } from './mockProjectData';
import { toProjectBlobServiceError, toProjectServiceError } from './project-service-error';

const mockUploadedFileBlobs = new Map<string, Blob>();
const downloadSizeToleranceBytes = 1024;

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

export const versionsService = {
  async list(projectId: string): Promise<SongVersion[]> {
    if (shouldUseMockProjectData) {
      await wait(220);
      return mockVersionsByProjectId[projectId] ?? [];
    }

    try {
      return await projectsApi.versions(projectId);
    } catch (error: unknown) {
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
      return await versionsApi.getById(versionId);
    } catch (error: unknown) {
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
      return await projectsApi.createVersion(projectId, payload);
    } catch (error: unknown) {
      throw toProjectServiceError(error, 'Unable to create version.');
    }
  },

  async uploadFile(params: {
    versionId: string;
    file: File;
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

    try {
      return await versionsApi.uploadFile(params.versionId, {
        file: params.file,
        type: params.type,
        onProgress: params.onProgress,
      });
    } catch (error: unknown) {
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
