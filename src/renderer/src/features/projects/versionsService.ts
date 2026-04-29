import axios from 'axios';
import { getApiErrorMessage, projectsApi, versionsApi } from '@/lib/api';
import type {
  SongVersion,
  VersionFileAsset,
  VersionFileAssetType,
} from '@/types/api';
import { mockVersionsByProjectId, useMockProjectData, wait } from './mockProjectData';

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
    if (useMockProjectData) {
      await wait(220);
      return mockVersionsByProjectId[projectId] ?? [];
    }

    try {
      return await projectsApi.versions(projectId);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(getApiErrorMessage(error, 'Unable to load versions.'));
      }

      throw error instanceof Error ? error : new Error('Unable to load versions.');
    }
  },

  async getById(versionId: string): Promise<SongVersion> {
    if (useMockProjectData) {
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
      if (axios.isAxiosError(error)) {
        throw new Error(getApiErrorMessage(error, 'Unable to load version.'));
      }

      throw error instanceof Error ? error : new Error('Unable to load version.');
    }
  },

  async create(projectId: string, payload: { notes?: string }): Promise<SongVersion> {
    if (useMockProjectData) {
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
      if (axios.isAxiosError(error)) {
        throw new Error(getApiErrorMessage(error, 'Unable to create version.'));
      }

      throw error instanceof Error ? error : new Error('Unable to create version.');
    }
  },

  async uploadFile(params: {
    versionId: string;
    file: File;
    type: VersionFileAssetType;
    onProgress?: (progress: number) => void;
  }): Promise<VersionFileAsset> {
    if (useMockProjectData) {
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
      if (axios.isAxiosError(error)) {
        throw new Error(getApiErrorMessage(error, `Unable to upload ${params.file.name}.`));
      }

      throw error instanceof Error ? error : new Error(`Unable to upload ${params.file.name}.`);
    }
  },

  async downloadFile(params: {
    versionId: string;
    fileAsset: VersionFileAsset;
  }): Promise<{ blob: Blob; fileName: string }> {
    if (useMockProjectData) {
      await wait(120);
      return {
        blob: new Blob([`Mock download for ${params.fileAsset.originalName}`], {
          type: params.fileAsset.mimeType || 'text/plain',
        }),
        fileName: params.fileAsset.originalName || params.fileAsset.name,
      };
    }

    try {
      const result = await versionsApi.downloadFile(params.versionId, params.fileAsset.id);

      return {
        blob: result.blob,
        fileName: result.fileName || params.fileAsset.originalName || params.fileAsset.name,
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(getApiErrorMessage(error, `Unable to download ${params.fileAsset.name}.`));
      }

      throw error instanceof Error
        ? error
        : new Error(`Unable to download ${params.fileAsset.name}.`);
    }
  },
};
