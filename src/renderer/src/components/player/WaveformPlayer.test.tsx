import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VersionFileAsset } from '@/types/api';
import { renderWithAppProviders } from '@/test/render';
import { WaveformPlayer } from './WaveformPlayer';

const mocks = vi.hoisted(() => ({
  downloadFile: vi.fn(),
  createWaveSurfer: vi.fn(),
}));

vi.mock('wavesurfer.js', () => ({
  default: {
    create: mocks.createWaveSurfer,
  },
}));

vi.mock('@/features/projects/versionsService', () => ({
  versionsService: {
    downloadFile: mocks.downloadFile,
  },
}));

describe('WaveformPlayer', () => {
  const mixFile: VersionFileAsset = {
    id: 'file-1',
    versionId: 'version-1',
    name: 'mix.wav',
    originalName: 'mix.wav',
    type: 'MIX',
    mimeType: 'audio/wav',
    sizeBytes: 100,
    storageKey: 'versions/version-1/mix.wav',
    url: '',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    mocks.downloadFile.mockReset();
    mocks.createWaveSurfer.mockReset();
  });

  it('shows an empty state when no mix file exists', () => {
    renderWithAppProviders(<WaveformPlayer versionId="version-1" />);

    expect(screen.getByText(/no mix file/i)).toBeInTheDocument();
    expect(screen.getByText(/render a waveform preview/i)).toBeInTheDocument();
  });

  it('shows a useful message when the download is not audio', async () => {
    mocks.downloadFile.mockResolvedValue({
      blob: new Blob(['{"message":"Not found"}'], { type: 'application/json' }),
      fileName: 'mix.wav',
    });

    renderWithAppProviders(<WaveformPlayer versionId="version-1" mixFile={mixFile} />);

    await waitFor(() => {
      expect(screen.getByText(/downloaded mix\.wav returned an api error: not found/i))
        .toBeInTheDocument();
    });
  });

  it('shows a corruption message when WAV header bytes are invalid', async () => {
    const corruptedWavHeader = new Uint8Array([
      0x52,
      0x49,
      0x46,
      0x46,
      0x24,
      0xef,
      0xbf,
      0xbd,
      0x57,
      0x41,
      0x56,
      0x45,
    ]);

    mocks.downloadFile.mockResolvedValue({
      blob: new Blob([corruptedWavHeader, new Uint8Array(100)], { type: 'audio/wav' }),
      fileName: 'mix.wav',
    });

    renderWithAppProviders(<WaveformPlayer versionId="version-1" mixFile={mixFile} />);

    await waitFor(() => {
      expect(screen.getByText(/downloaded mix\.wav looks like a corrupted wav file/i))
        .toBeInTheDocument();
    });
  });

  it('shows string errors emitted by WaveSurfer', async () => {
    const handlers = new Map<string, (value: unknown) => void>();

    mocks.downloadFile.mockResolvedValue({
      blob: new Blob(['audio bytes'], { type: 'audio/wav' }),
      fileName: 'mix.wav',
    });
    mocks.createWaveSurfer.mockReturnValue({
      destroy: vi.fn(),
      getCurrentTime: vi.fn(() => 0),
      getDuration: vi.fn(() => 0),
      load: vi.fn(async () => {
        handlers.get('error')?.('Unable to decode audio data.');
      }),
      on: vi.fn((eventName: string, handler: (value: unknown) => void) => {
        handlers.set(eventName, handler);
      }),
      playPause: vi.fn(),
      setTime: vi.fn(),
    });

    renderWithAppProviders(<WaveformPlayer versionId="version-1" mixFile={mixFile} />);

    await waitFor(() => {
      expect(screen.getByText('Unable to decode audio data.')).toBeInTheDocument();
    });
  });

  it('translates Chromium demuxer errors into an actionable message', async () => {
    const handlers = new Map<string, (value: unknown) => void>();

    mocks.downloadFile.mockResolvedValue({
      blob: new Blob(['audio bytes'], { type: 'audio/wav' }),
      fileName: 'mix.wav',
    });
    mocks.createWaveSurfer.mockReturnValue({
      destroy: vi.fn(),
      getCurrentTime: vi.fn(() => 0),
      getDuration: vi.fn(() => 0),
      load: vi.fn(async () => {
        handlers.get('error')?.('DEMUXER_ERROR_COULD_NOT_OPEN: FFmpegDemuxer: open context failed');
      }),
      on: vi.fn((eventName: string, handler: (value: unknown) => void) => {
        handlers.set(eventName, handler);
      }),
      playPause: vi.fn(),
      setTime: vi.fn(),
    });

    renderWithAppProviders(<WaveformPlayer versionId="version-1" mixFile={mixFile} />);

    await waitFor(() => {
      expect(
        screen.getByText(
          /the downloaded mix\.wav file could not be decoded as browser-playable audio/i,
        ),
      ).toBeInTheDocument();
    });
  });
});
