import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VersionFileAsset } from '@/types/api';
import { versionsService } from './versionsService';

const mocks = vi.hoisted(() => ({
  downloadFile: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  projectsApi: {},
  versionsApi: {
    downloadFile: mocks.downloadFile,
  },
}));

vi.mock('./mockProjectData', () => ({
  mockVersionsByProjectId: {},
  shouldUseMockProjectData: false,
  wait: vi.fn(),
}));

describe('versionsService.downloadFile', () => {
  const fileAsset: VersionFileAsset = {
    id: 'file-1',
    versionId: 'version-1',
    name: 'mix.wav',
    originalName: 'Neon Skyline Mix v3.wav',
    type: 'MIX',
    mimeType: 'audio/wav',
    sizeBytes: 14_998_044,
    storageKey: 'seed-assets/version-1/mix.wav',
    url: '',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    mocks.downloadFile.mockReset();
  });

  it('uses file metadata when the download response has a generic filename', async () => {
    mocks.downloadFile.mockResolvedValue({
      blob: new Blob([new Uint8Array(fileAsset.sizeBytes)], { type: 'audio/wav' }),
      fileName: 'download',
    });

    await expect(
      versionsService.downloadFile({ versionId: 'version-1', fileAsset }),
    ).resolves.toMatchObject({
      fileName: 'Neon Skyline Mix v3.wav',
    });
  });

  it('rejects downloads that are much smaller than the file metadata', async () => {
    mocks.downloadFile.mockResolvedValue({
      blob: new Blob([new Uint8Array(468_187)], { type: 'audio/wav' }),
      fileName: 'download',
    });

    await expect(
      versionsService.downloadFile({ versionId: 'version-1', fileAsset }),
    ).rejects.toThrow(
      'Downloaded Neon Skyline Mix v3.wav is incomplete or corrupted. Expected 14.3 MB, received 457.2 KB.',
    );
  });
});
