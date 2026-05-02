import { EmptyState } from '@/components/ui';
import type { VersionComment } from '@/types/api';
import { CommentListItem } from './CommentListItem';

interface CommentListProps {
  comments: VersionComment[];
  currentUserId?: string;
  deletingCommentId: string | null;
  onDeleteComment: (commentId: string) => Promise<void>;
  onSeekComment: (timestampSeconds: number) => void;
}

export function CommentList({
  comments,
  currentUserId,
  deletingCommentId,
  onDeleteComment,
  onSeekComment,
}: CommentListProps) {
  if (comments.length === 0) {
    return (
      <EmptyState
        title="No timestamp comments"
        description="Post a comment while listening to anchor feedback to the current playback position."
      />
    );
  }

  return (
    <ul className="comment-list">
      {comments.map((comment) => (
        <CommentListItem
          key={comment.id}
          comment={comment}
          canDelete={comment.author.id === currentUserId}
          deleting={comment.id === deletingCommentId}
          onDelete={onDeleteComment}
          onSeek={onSeekComment}
        />
      ))}
    </ul>
  );
}
