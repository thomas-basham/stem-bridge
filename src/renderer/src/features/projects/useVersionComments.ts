import { useCallback, useEffect, useState } from 'react';
import { commentsService } from '@/features/projects/commentsService';
import type { VersionComment } from '@/types/api';

type VersionCommentsState =
  | {
      status: 'idle';
      data: VersionComment[];
      errorMessage: null;
    }
  | {
      status: 'loading';
      data: VersionComment[];
      errorMessage: null;
    }
  | {
      status: 'success';
      data: VersionComment[];
      errorMessage: null;
    }
  | {
      status: 'error';
      data: VersionComment[];
      errorMessage: string;
    };

type UseVersionCommentsResult = VersionCommentsState & {
  refresh: () => Promise<void>;
  createComment: (payload: { text: string; timestampSeconds: number }) => Promise<VersionComment>;
  deleteComment: (commentId: string) => Promise<void>;
};

export function useVersionComments(versionId: string | null): UseVersionCommentsResult {
  const [state, setState] = useState<VersionCommentsState>({
    status: 'idle',
    data: [],
    errorMessage: null,
  });

  const refresh = useCallback(async (): Promise<void> => {
    if (!versionId) {
      setState({ status: 'idle', data: [], errorMessage: null });
      return;
    }

    setState((currentState) => ({
      status: 'loading',
      data: currentState.data,
      errorMessage: null,
    }));

    try {
      const comments = await commentsService.list(versionId);
      setState({ status: 'success', data: comments, errorMessage: null });
    } catch (error: unknown) {
      setState({
        status: 'error',
        data: [],
        errorMessage: error instanceof Error ? error.message : 'Unable to load comments.',
      });
    }
  }, [versionId]);

  const createComment = useCallback(
    async (payload: { text: string; timestampSeconds: number }): Promise<VersionComment> => {
      if (!versionId) {
        throw new Error('Select a version before commenting.');
      }

      const comment = await commentsService.create(versionId, payload);
      await refresh();
      return comment;
    },
    [refresh, versionId],
  );

  const deleteComment = useCallback(
    async (commentId: string): Promise<void> => {
      await commentsService.remove(commentId);
      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
    createComment,
    deleteComment,
  };
}
