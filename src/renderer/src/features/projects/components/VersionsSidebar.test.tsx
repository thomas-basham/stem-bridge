import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithAppProviders } from '@/test/render';
import { VersionsSidebar } from './VersionsSidebar';
import type { UseProjectVersionsResult } from '@/features/projects/useProjectVersions';
import type { SongVersion } from '@/types/api';

const versions: SongVersion[] = [
  {
    id: 'version-1',
    projectId: 'project-1',
    versionNumber: 1,
    notes: 'Initial mix pass',
    createdAt: '2026-05-01T17:00:00.000Z',
    createdBy: {
      id: 'user-1',
      email: 'nova@stembridge.app',
      name: 'Nova Lane',
    },
  },
  {
    id: 'version-2',
    projectId: 'project-1',
    versionNumber: 2,
    notes: 'Updated hook and tighter outro',
    createdAt: '2026-05-02T17:00:00.000Z',
    createdBy: {
      id: 'user-2',
      email: 'kai@stembridge.app',
      name: 'Kai Mercer',
    },
  },
];

const versionsState: UseProjectVersionsResult = {
  status: 'success',
  data: versions,
  errorMessage: null,
  refresh: vi.fn(),
};

describe('VersionsSidebar', () => {
  it('selects the first available version when the current selection is missing', async () => {
    const onSelectVersion = vi.fn();

    renderWithAppProviders(
      <VersionsSidebar
        versionsState={versionsState}
        selectedVersionId="missing-version"
        onSelectVersion={onSelectVersion}
      />,
    );

    await waitFor(() => {
      expect(onSelectVersion).toHaveBeenCalledWith('version-1');
    });
  });

  it('allows selecting a version from the list', async () => {
    const onSelectVersion = vi.fn();
    const user = userEvent.setup();

    renderWithAppProviders(
      <VersionsSidebar
        versionsState={versionsState}
        selectedVersionId="version-1"
        onSelectVersion={onSelectVersion}
      />,
    );

    await user.click(screen.getByRole('button', { name: /version 2/i }));

    expect(onSelectVersion).toHaveBeenCalledWith('version-2');
  });
});
