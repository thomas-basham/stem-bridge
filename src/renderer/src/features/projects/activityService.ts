import axios from 'axios';
import { getApiErrorMessage, projectsApi, type ActivityQuery } from '@/lib/api';
import type { ActivityEvent } from '@/types/api';
import { useMockProjectData, wait } from './mockProjectData';

const mockActivityByProjectId: Record<string, ActivityEvent[]> = {
  'atlas-after-hours': [
    {
      id: 'atlas-activity-comment',
      type: 'COMMENT_ADDED',
      metadata: {
        versionId: 'atlas-v6',
        timestampSeconds: 74.5,
      },
      createdAt: '2026-05-01T19:15:00.000Z',
    },
    {
      id: 'atlas-activity-invite',
      type: 'INVITE_SENT',
      metadata: {
        email: 'mix.engineer@example.com',
      },
      createdAt: '2026-05-01T17:35:00.000Z',
    },
    {
      id: 'atlas-activity-file',
      type: 'FILE_UPLOADED',
      metadata: {
        name: 'atlas-after-hours-mix-v6.wav',
        type: 'MIX',
      },
      createdAt: '2026-04-21T23:46:00.000Z',
    },
    {
      id: 'atlas-activity-version',
      type: 'VERSION_CREATED',
      metadata: {
        versionNumber: 6,
      },
      createdAt: '2026-04-21T23:40:00.000Z',
    },
  ],
  'electric-harbor': [
    {
      id: 'electric-activity-version',
      type: 'VERSION_CREATED',
      metadata: {
        versionNumber: 11,
      },
      createdAt: '2026-04-21T18:15:00.000Z',
    },
  ],
  'neon-saturn': [],
};

const sortActivityNewestFirst = (events: ActivityEvent[]): ActivityEvent[] => {
  return [...events].sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
};

export const activityService = {
  async list(projectId: string, query: ActivityQuery = { page: 1, pageSize: 20 }): Promise<ActivityEvent[]> {
    if (useMockProjectData) {
      await wait(180);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const start = (page - 1) * pageSize;
      return sortActivityNewestFirst(mockActivityByProjectId[projectId] ?? []).slice(
        start,
        start + pageSize,
      );
    }

    try {
      return await projectsApi.activity(projectId, query);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(getApiErrorMessage(error, 'Unable to load activity.'));
      }

      throw error instanceof Error ? error : new Error('Unable to load activity.');
    }
  },
};
