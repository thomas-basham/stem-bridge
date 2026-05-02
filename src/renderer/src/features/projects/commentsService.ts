import { commentsApi } from '@/lib/api';
import type { VersionComment } from '@/types/api';
import { mockVersionsByProjectId, shouldUseMockProjectData, wait } from './mockProjectData';
import { toProjectServiceError } from './project-service-error';

const getMockCommentsForVersion = (versionId: string): VersionComment[] | null => {
  for (const versions of Object.values(mockVersionsByProjectId)) {
    const version = versions.find((candidate) => candidate.id === versionId);

    if (version) {
      version.comments ??= [];
      return version.comments;
    }
  }

  return null;
};

export const commentsService = {
  async list(versionId: string): Promise<VersionComment[]> {
    if (shouldUseMockProjectData) {
      await wait(180);
      return [...(getMockCommentsForVersion(versionId) ?? [])].sort((left, right) => {
        return left.timestampSeconds - right.timestampSeconds;
      });
    }

    try {
      return await commentsApi.list(versionId);
    } catch (error: unknown) {
      throw toProjectServiceError(error, 'Unable to load comments.');
    }
  },

  async create(
    versionId: string,
    payload: { text: string; timestampSeconds: number },
  ): Promise<VersionComment> {
    if (shouldUseMockProjectData) {
      await wait(160);
      const comments = getMockCommentsForVersion(versionId);

      if (!comments) {
        throw new Error('Unable to load comments.');
      }

      const comment: VersionComment = {
        id: window.crypto.randomUUID(),
        versionId,
        text: payload.text,
        timestampSeconds: payload.timestampSeconds,
        createdAt: new Date().toISOString(),
        author: {
          id: 'mock-current-user',
          email: 'producer@stembridge.app',
          name: 'Producer',
        },
      };

      comments.push(comment);
      comments.sort((left, right) => left.timestampSeconds - right.timestampSeconds);
      return comment;
    }

    try {
      return await commentsApi.create(versionId, payload);
    } catch (error: unknown) {
      throw toProjectServiceError(error, 'Unable to create comment.');
    }
  },

  async remove(commentId: string): Promise<void> {
    if (shouldUseMockProjectData) {
      await wait(120);

      for (const versions of Object.values(mockVersionsByProjectId)) {
        for (const version of versions) {
          const commentIndex =
            version.comments?.findIndex((comment) => comment.id === commentId) ?? -1;

          if (commentIndex >= 0) {
            version.comments?.splice(commentIndex, 1);
            return;
          }
        }
      }

      throw new Error('Unable to delete comment.');
    }

    try {
      await commentsApi.remove(commentId);
    } catch (error: unknown) {
      throw toProjectServiceError(error, 'Unable to delete comment.');
    }
  },
};
