import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithAppProviders } from '@/test/render';
import { UploadVersionModal } from './UploadVersionModal';
import { versionsService } from '@/features/projects/versionsService';
import { markDesktopDawCandidatesImported } from '@/lib/desktop';
import type { DesktopCachedUploadFile } from '@shared/types';

vi.mock('@/features/projects/versionsService', () => ({
  versionsService: {
    create: vi.fn(),
    uploadFile: vi.fn(),
  },
}));

vi.mock('@/lib/desktop', () => ({
  markDesktopDawCandidatesImported: vi.fn(),
}));

const cachedMidiFile: DesktopCachedUploadFile = {
  id: 'cached-midi-1',
  fileName: 'Bass.mid',
  mimeType: 'audio/midi',
  sizeBytes: 4,
  cachePath: '/cache/Bass.mid',
  createdAt: '2026-05-06T00:00:00.000Z',
};

const midiFile = new File(['midi'], 'Bass.mid', { type: 'audio/midi' });

describe('UploadVersionModal', () => {
  beforeEach(() => {
    vi.mocked(versionsService.create).mockReset();
    vi.mocked(versionsService.uploadFile).mockReset();
    vi.mocked(markDesktopDawCandidatesImported).mockReset();
    vi.mocked(versionsService.uploadFile).mockResolvedValue({
      id: 'file-1',
      versionId: 'version-2',
      name: 'Bass.mid',
      originalName: 'Bass.mid',
      type: 'MIDI',
      mimeType: 'audio/midi',
      sizeBytes: 4,
      storageKey: 'files/Bass.mid',
      url: '',
      createdAt: '2026-05-06T00:00:00.000Z',
    });
    vi.mocked(markDesktopDawCandidatesImported).mockResolvedValue([]);
  });

  it('defaults DAW imports to the latest version and preserves detected file type', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithAppProviders(
      <UploadVersionModal
        open
        projectId="project-1"
        latestVersion={{ id: 'version-2', versionNumber: 2 }}
        initialFiles={[
          {
            candidateId: 'candidate-1',
            file: midiFile,
            cachedFile: cachedMidiFile,
            type: 'MIDI',
          },
        ]}
        initialFilesKey={1}
        onClose={vi.fn()}
        onComplete={onComplete}
      />,
    );

    expect(screen.getByRole('radio', { name: /add to latest version/i })).toBeChecked();
    expect(screen.getByLabelText('Type')).toHaveValue('MIDI');

    await user.click(screen.getByRole('button', { name: /upload files/i }));

    await waitFor(() => {
      expect(versionsService.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          versionId: 'version-2',
          file: midiFile,
          cachedFile: cachedMidiFile,
          type: 'MIDI',
        }),
      );
    });
    expect(versionsService.create).not.toHaveBeenCalled();
    expect(markDesktopDawCandidatesImported).toHaveBeenCalledWith(['candidate-1']);
    expect(onComplete).toHaveBeenCalledWith('version-2');
  });

  it('forces a new version when the project has no latest version', async () => {
    vi.mocked(versionsService.create).mockResolvedValue({
      id: 'version-1',
      projectId: 'project-1',
      versionNumber: 1,
      notes: undefined,
      createdAt: '2026-05-06T00:00:00.000Z',
      createdBy: {
        id: 'user-1',
        email: 'producer@stembridge.app',
      },
      fileAssetCount: 0,
      commentCount: 0,
      fileAssets: [],
      comments: [],
    });
    const onComplete = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithAppProviders(
      <UploadVersionModal
        open
        projectId="project-1"
        latestVersion={null}
        initialFiles={[
          {
            file: midiFile,
            cachedFile: cachedMidiFile,
            type: 'MIDI',
          },
        ]}
        initialFilesKey={1}
        onClose={vi.fn()}
        onComplete={onComplete}
      />,
    );

    expect(screen.getByRole('radio', { name: /add to latest version/i })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /create new version/i })).toBeChecked();

    await user.click(screen.getByRole('button', { name: /upload version/i }));

    await waitFor(() => {
      expect(versionsService.create).toHaveBeenCalledWith('project-1', {
        notes: undefined,
      });
    });
    expect(versionsService.uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        versionId: 'version-1',
        type: 'MIDI',
      }),
    );
    expect(onComplete).toHaveBeenCalledWith('version-1');
  });
});
