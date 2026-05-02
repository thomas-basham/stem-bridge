import {
  ACTIVITY_EVENT_TYPES,
  ACTIVITY_METADATA_KEYS,
  DEFAULT_ACTIVITY_QUERY,
  PRIMARY_MIX_FILE_TYPE,
} from '@/constants/app-constants';
import { projectsApi, type ActivityQuery } from '@/lib/api';
import type { ActivityEvent } from '@/types/api';
import { shouldUseMockProjectData, wait } from './mockProjectData';
import { toProjectServiceError } from './project-service-error';

const mockActivityByProjectId: Record<string, ActivityEvent[]> = {
  'atlas-after-hours': [
    {
      id: 'atlas-activity-comment',
      type: ACTIVITY_EVENT_TYPES.commentAdded,
      metadata: {
        versionId: 'atlas-v6',
        [ACTIVITY_METADATA_KEYS.timestampSeconds]: 74.5,
      },
      createdAt: '2026-05-01T19:15:00.000Z',
    },
    {
      id: 'atlas-activity-invite',
      type: ACTIVITY_EVENT_TYPES.inviteSent,
      metadata: {
        [ACTIVITY_METADATA_KEYS.email]: 'mix.engineer@example.com',
      },
      createdAt: '2026-05-01T17:35:00.000Z',
    },
    {
      id: 'atlas-activity-file',
      type: ACTIVITY_EVENT_TYPES.fileUploaded,
      metadata: {
        [ACTIVITY_METADATA_KEYS.fileName]: 'atlas-after-hours-mix-v6.wav',
        [ACTIVITY_METADATA_KEYS.fileType]: PRIMARY_MIX_FILE_TYPE,
      },
      createdAt: '2026-04-21T23:46:00.000Z',
    },
    {
      id: 'atlas-activity-version',
      type: ACTIVITY_EVENT_TYPES.versionCreated,
      metadata: {
        [ACTIVITY_METADATA_KEYS.versionNumber]: 6,
      },
      createdAt: '2026-04-21T23:40:00.000Z',
    },
  ],
  'electric-harbor': [
    {
      id: 'electric-activity-version',
      type: ACTIVITY_EVENT_TYPES.versionCreated,
      metadata: {
        [ACTIVITY_METADATA_KEYS.versionNumber]: 11,
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
  async list(
    projectId: string,
    query: ActivityQuery = DEFAULT_ACTIVITY_QUERY,
  ): Promise<ActivityEvent[]> {
    if (shouldUseMockProjectData) {
      await wait(180);
      const page = query.page ?? DEFAULT_ACTIVITY_QUERY.page;
      const pageSize = query.pageSize ?? DEFAULT_ACTIVITY_QUERY.pageSize;
      const start = (page - 1) * pageSize;
      return sortActivityNewestFirst(mockActivityByProjectId[projectId] ?? []).slice(
        start,
        start + pageSize,
      );
    }

    try {
      return await projectsApi.activity(projectId, query);
    } catch (error: unknown) {
      throw toProjectServiceError(error, 'Unable to load activity.');
    }
  },
};
