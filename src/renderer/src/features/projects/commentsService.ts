import type { DesktopQueuedCommentPayload } from '@shared/types';
import { commentsApi } from '@/lib/api';
import { getStoredUser } from '@/lib/auth-storage';
import {
  desktopSnapshotKeys,
  enqueueDesktopQueueItem,
  isLikelyNetworkError,
  readDesktopSnapshot,
  saveDesktopSnapshot,
} from '@/lib/desktop';
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

const sortComments = (comments: VersionComment[]): VersionComment[] => {
  return [...comments].sort((left, right) => left.timestampSeconds - right.timestampSeconds);
};

const getCurrentUser = (): VersionComment['author'] => {
  return (
    getStoredUser() ?? {
      id: 'local-current-user',
      email: 'offline@stembridge.local',
      name: 'Offline User',
    }
  );
};

const saveCommentsSnapshot = async (
  versionId: string,
  comments: VersionComment[],
): Promise<void> => {
  await saveDesktopSnapshot(desktopSnapshotKeys.comments(versionId), sortComments(comments));
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
      const comments = await commentsApi.list(versionId);
      void saveCommentsSnapshot(versionId, comments);
      return comments;
    } catch (error: unknown) {
      if (isLikelyNetworkError(error)) {
        const cachedComments = await readDesktopSnapshot<VersionComment[]>(
          desktopSnapshotKeys.comments(versionId),
        );

        if (cachedComments) {
          return cachedComments.data;
        }
      }

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
      const comment = await commentsApi.create(versionId, payload);
      const cachedComments = await readDesktopSnapshot<VersionComment[]>(
        desktopSnapshotKeys.comments(versionId),
      );
      void saveCommentsSnapshot(versionId, [...(cachedComments?.data ?? []), comment]);
      return comment;
    } catch (error: unknown) {
      if (isLikelyNetworkError(error)) {
        const cachedVersion = await readDesktopSnapshot<{ projectId: string }>(
          desktopSnapshotKeys.version(versionId),
        );
        const tempCommentId = `local-comment-${window.crypto.randomUUID()}`;
        const comment: VersionComment = {
          id: tempCommentId,
          versionId,
          text: payload.text,
          timestampSeconds: payload.timestampSeconds,
          createdAt: new Date().toISOString(),
          author: getCurrentUser(),
        };
        const queuePayload: DesktopQueuedCommentPayload = {
          projectId: cachedVersion?.data.projectId ?? '',
          versionId,
          tempCommentId,
          text: payload.text,
          timestampSeconds: payload.timestampSeconds,
        };
        const queuedItem = await enqueueDesktopQueueItem('comment', queuePayload);

        if (!queuedItem) {
          throw toProjectServiceError(error, 'Unable to create comment.');
        }

        const cachedComments = await readDesktopSnapshot<VersionComment[]>(
          desktopSnapshotKeys.comments(versionId),
        );
        await saveCommentsSnapshot(versionId, [...(cachedComments?.data ?? []), comment]);
        return comment;
      }

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
