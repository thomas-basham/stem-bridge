import type { ProjectSummary } from '@shared/types';
import type { SongVersion } from '@/types/api';

export const useMockProjectData = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export const wait = async (durationMs: number): Promise<void> => {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
};

const mockUsers = {
  nova: {
    id: 'nova-lane',
    email: 'nova@stembridge.app',
    name: 'Nova Lane',
  },
  kai: {
    id: 'kai-mercer',
    email: 'kai@stembridge.app',
    name: 'Kai Mercer',
  },
  ivy: {
    id: 'ivy-rhodes',
    email: 'ivy@stembridge.app',
    name: 'Ivy Rhodes',
  },
};

export const mockVersionsByProjectId: Record<string, SongVersion[]> = {
  'atlas-after-hours': [
    {
      id: 'atlas-v6',
      projectId: 'atlas-after-hours',
      versionNumber: 6,
      notes: 'Tighter second drop, brighter hats, and a reduced bridge before the final chorus.',
      createdAt: '2026-04-21T23:40:00.000Z',
      createdBy: mockUsers.nova,
      fileAssetCount: 4,
      commentCount: 8,
      fileAssets: [],
      comments: [],
    },
    {
      id: 'atlas-v5',
      projectId: 'atlas-after-hours',
      versionNumber: 5,
      notes: 'Added alternate vocal stack and updated the pre-chorus automation pass.',
      createdAt: '2026-04-20T21:25:00.000Z',
      createdBy: mockUsers.kai,
      fileAssetCount: 3,
      commentCount: 5,
      fileAssets: [],
      comments: [],
    },
  ],
  'electric-harbor': [
    {
      id: 'electric-v11',
      projectId: 'electric-harbor',
      versionNumber: 11,
      notes: 'Reference limiter removed, piano bus widened, and low mids cleaned up.',
      createdAt: '2026-04-21T18:15:00.000Z',
      createdBy: mockUsers.kai,
      fileAssetCount: 6,
      commentCount: 11,
      fileAssets: [],
      comments: [],
    },
  ],
  'neon-saturn': [],
};

export const mockProjects: ProjectSummary[] = [
  {
    id: 'atlas-after-hours',
    name: 'Atlas After Hours',
    bpm: 124,
    musicalKey: 'A minor',
    owner: mockUsers.nova,
    collaboratorCount: 3,
    versionCount: mockVersionsByProjectId['atlas-after-hours'].length,
    createdAt: '2026-04-18T15:15:00.000Z',
    updatedAt: '2026-04-21T23:40:00.000Z',
    latestVersion: mockVersionsByProjectId['atlas-after-hours'][0],
  },
  {
    id: 'electric-harbor',
    name: 'Electric Harbor',
    bpm: 96,
    musicalKey: 'D major',
    owner: mockUsers.kai,
    collaboratorCount: 5,
    versionCount: mockVersionsByProjectId['electric-harbor'].length,
    createdAt: '2026-04-16T19:20:00.000Z',
    updatedAt: '2026-04-21T18:15:00.000Z',
    latestVersion: mockVersionsByProjectId['electric-harbor'][0],
  },
  {
    id: 'neon-saturn',
    name: 'Neon Saturn',
    bpm: null,
    musicalKey: null,
    owner: mockUsers.ivy,
    collaboratorCount: 2,
    versionCount: 0,
    createdAt: '2026-04-20T16:10:00.000Z',
    updatedAt: '2026-04-20T16:10:00.000Z',
    latestVersion: null,
  },
];
