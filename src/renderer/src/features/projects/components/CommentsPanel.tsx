import { useMemo, useState } from 'react';
import { EmptyState, LoadingSpinner, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { notifyProjectActivityChanged } from '@/features/projects/projectActivityEvents';
import { useVersionComments } from '@/features/projects/useVersionComments';
import { AddCommentForm } from './AddCommentForm';
import { CommentList } from './CommentList';

interface CommentsPanelProps {
  projectId: string;
  versionId: string;
  currentTimeSeconds: number;
  onSeekComment: (timestampSeconds: number) => void;
}

export function CommentsPanel({
  projectId,
  versionId,
  currentTimeSeconds,
  onSeekComment,
}: CommentsPanelProps) {
  const toast = useToast();
  const { user } = useAuth();
  const commentsState = useVersionComments(versionId);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const sortedComments = useMemo(() => {
    return [...commentsState.data].sort((left, right) => {
      if (left.timestampSeconds !== right.timestampSeconds) {
        return left.timestampSeconds - right.timestampSeconds;
      }

      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    });
  }, [commentsState.data]);

  const handleDeleteComment = async (commentId: string): Promise<void> => {
    setDeletingCommentId(commentId);
    setDeleteError(null);

    try {
      await commentsState.deleteComment(commentId);
      toast.success('Comment deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete comment.';
      setDeleteError(message);
      toast.error('Delete failed', message);
    } finally {
      setDeletingCommentId(null);
    }
  };

  return (
    <section className="comments-panel">
      <header className="comments-panel__header">
        <div>
          <h4>Timestamp Comments</h4>
          <p>Feedback is anchored to the selected version timeline.</p>
        </div>
      </header>

      <AddCommentForm
        currentTimeSeconds={currentTimeSeconds}
        disabled={commentsState.status === 'loading'}
        onSubmit={async (payload) => {
          await commentsState.createComment(payload);
          notifyProjectActivityChanged(projectId);
        }}
      />

      {commentsState.status === 'loading' ? (
        <div className="comments-panel__loading">
          <LoadingSpinner label="Loading comments..." size="sm" />
        </div>
      ) : null}

      {commentsState.status === 'error' ? (
        <EmptyState
          tone="error"
          title="Comments unavailable"
          description={commentsState.errorMessage}
        />
      ) : null}

      {deleteError ? (
        <p className="comments-panel__error" role="alert">
          {deleteError}
        </p>
      ) : null}

      {commentsState.status === 'success' ? (
        <CommentList
          comments={sortedComments}
          currentUserId={user?.id}
          deletingCommentId={deletingCommentId}
          onDeleteComment={handleDeleteComment}
          onSeekComment={onSeekComment}
        />
      ) : null}
    </section>
  );
}
