import axios from 'axios';
import type { ProjectSummary } from '@shared/types';
import { apiClient } from '@/lib/api/client';

const mockProjects: ProjectSummary[] = [
  {
    id: 'atlas-after-hours',
    title: 'Atlas After Hours',
    owner: 'Nova Lane',
    collaboratorCount: 3,
    versionCount: 6,
    lastUpdated: '2026-04-21T23:40:00.000Z',
    status: 'In Review',
  },
  {
    id: 'electric-harbor',
    title: 'Electric Harbor',
    owner: 'Kai Mercer',
    collaboratorCount: 5,
    versionCount: 11,
    lastUpdated: '2026-04-21T18:15:00.000Z',
    status: 'Mix Prep',
  },
  {
    id: 'neon-saturn',
    title: 'Neon Saturn',
    owner: 'Ivy Rhodes',
    collaboratorCount: 2,
    versionCount: 4,
    lastUpdated: '2026-04-20T16:10:00.000Z',
    status: 'Tracking',
  },
];

const useMockData = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

const wait = async (durationMs: number): Promise<void> => {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
};

export const projectsService = {
  async list(): Promise<ProjectSummary[]> {
    if (useMockData) {
      await wait(450);
      return mockProjects;
    }

    try {
      const response = await apiClient.get<ProjectSummary[]>('/projects');
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.statusText || error.message);
      }

      throw error instanceof Error ? error : new Error('Unable to load projects.');
    }
  },
};
