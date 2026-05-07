import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithAppProviders } from '@/test/render';
import { AbletonWatchPanel } from './AbletonWatchPanel';
import { useDawBridge, type ImportedDawFile } from '@/hooks/useDawBridge';
import type { DesktopDawFileCandidate } from '@shared/types';

vi.mock('@/hooks/useDawBridge', () => ({
  useDawBridge: vi.fn(),
}));

const createCandidate = (index: number): DesktopDawFileCandidate => ({
  id: `candidate-${index}`,
  folderId: 'folder-1',
  path: `/tmp/file-${index}.mid`,
  name: `File ${index}.mid`,
  type: 'MIDI',
  mimeType: 'audio/midi',
  sizeBytes: 128,
  modifiedAt: '2026-05-06T00:00:00.000Z',
  imported: false,
  discoveredAt: '2026-05-06T00:00:00.000Z',
});

const createImportedFile = (candidate: DesktopDawFileCandidate): ImportedDawFile => ({
  candidateId: candidate.id,
  file: new File(['midi'], candidate.name, { type: candidate.mimeType }),
  cachedFile: {
    id: `cached-${candidate.id}`,
    fileName: candidate.name,
    mimeType: candidate.mimeType,
    sizeBytes: candidate.sizeBytes,
    cachePath: `/cache/${candidate.name}`,
    createdAt: '2026-05-06T00:00:00.000Z',
  },
  type: candidate.type,
});

describe('AbletonWatchPanel', () => {
  it('imports every active candidate when Import all is clicked', async () => {
    const candidates = Array.from({ length: 10 }, (_, index) => createCandidate(index + 1));
    const importedFiles = candidates.map(createImportedFile);
    const cacheCandidates = vi.fn().mockResolvedValue(importedFiles);
    const onImportFiles = vi.fn();

    vi.mocked(useDawBridge).mockReturnValue({
      folders: [
        {
          id: 'folder-1',
          label: 'Ableton Project',
          path: '/tmp/project',
          dawType: 'ABLETON',
          enabled: true,
          createdAt: '2026-05-06T00:00:00.000Z',
        },
      ],
      candidates,
      isLoading: false,
      errorMessage: null,
      chooseFolder: vi.fn(),
      removeFolder: vi.fn(),
      cacheCandidate: vi.fn(),
      cacheCandidates,
      importCandidate: vi.fn(),
      refresh: vi.fn(),
    });

    const user = userEvent.setup();
    renderWithAppProviders(<AbletonWatchPanel onImportFiles={onImportFiles} />);

    await user.click(screen.getByRole('button', { name: /import all/i }));

    expect(cacheCandidates).toHaveBeenCalledWith(candidates.map((candidate) => candidate.id));
    await waitFor(() => {
      expect(onImportFiles).toHaveBeenCalledWith(importedFiles);
    });
    expect(screen.getByText(/showing 8 of 10 detected exports/i)).toBeInTheDocument();
  });
});
