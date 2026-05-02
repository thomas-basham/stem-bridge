import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { projectsApi } from '@/lib/api';
import { renderWithAppProviders } from '@/test/render';
import { ProjectsPage } from './ProjectsPage';
import type { ProjectSummary } from '@shared/types';

vi.mock('@/lib/api', () => ({
  projectsApi: {
    list: vi.fn(),
    create: vi.fn(),
    getById: vi.fn(),
  },
  getApiErrorMessage: (error: unknown, fallback = 'Request failed.') =>
    error instanceof Error ? error.message : fallback,
  getBlobApiErrorMessage: async (error: unknown, fallback = 'Request failed.') =>
    error instanceof Error ? error.message : fallback,
}));

const mockProjects: ProjectSummary[] = [
  {
    id: 'project-1',
    name: 'Atlas After Hours',
    bpm: 124,
    musicalKey: 'A minor',
    collaboratorCount: 3,
    versionCount: 6,
    createdAt: '2026-04-18T15:15:00.000Z',
    updatedAt: '2026-04-21T23:40:00.000Z',
    latestVersion: {
      id: 'version-6',
      versionNumber: 6,
      createdAt: '2026-04-21T23:40:00.000Z',
    },
  },
  {
    id: 'project-2',
    name: 'Electric Harbor',
    bpm: 96,
    musicalKey: 'D major',
    collaboratorCount: 2,
    versionCount: 1,
    createdAt: '2026-04-16T19:20:00.000Z',
    updatedAt: '2026-04-21T18:15:00.000Z',
    latestVersion: null,
  },
];

describe('ProjectsPage', () => {
  beforeEach(() => {
    vi.mocked(projectsApi.list).mockResolvedValue(mockProjects);
  });

  it('renders projects from the mocked API', async () => {
    renderWithAppProviders(<ProjectsPage />);

    expect(await screen.findByText('Atlas After Hours')).toBeInTheDocument();
    expect(screen.getByText('Electric Harbor')).toBeInTheDocument();
    expect(screen.getByText('124')).toBeInTheDocument();
    expect(screen.getByText('A minor')).toBeInTheDocument();
    expect(screen.getByText('v6')).toBeInTheDocument();
    expect(projectsApi.list).toHaveBeenCalledTimes(1);
  });

  it('keeps the create project modal from submitting when required fields are missing', async () => {
    const user = userEvent.setup();
    renderWithAppProviders(<ProjectsPage />);

    await screen.findByText('Atlas After Hours');
    await user.click(screen.getByRole('button', { name: /new project/i }));

    const dialog = screen.getByRole('dialog', { name: /new project/i });
    await user.click(within(dialog).getByRole('button', { name: /create project/i }));

    await waitFor(() => {
      expect(projectsApi.create).not.toHaveBeenCalled();
    });
    expect(within(dialog).getByLabelText(/project name/i)).toBeInvalid();
  });
});
