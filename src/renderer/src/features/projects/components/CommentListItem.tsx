import { Button } from '@/components/ui';
import { formatPlaybackTime } from '@/lib/time';
import type { VersionComment } from '@/types/api';

interface CommentListItemProps {
  comment: VersionComment;
  canDelete: boolean;
  deleting: boolean;
  onDelete: (commentId: string) => Promise<void>;
  onSeek: (timestampSeconds: number) => void;
}

const formatCreatedDate = (isoDate: string): string => {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const getAuthorLabel = (comment: VersionComment): string => {
  return comment.author.name || comment.author.email || 'Unknown author';
};

export function CommentListItem({
  comment,
  canDelete,
  deleting,
  onDelete,
  onSeek,
}: CommentListItemProps) {
  return (
    <li className="comment-list-item">
      <button
        type="button"
        className="comment-list-item__seek"
        onClick={() => onSeek(comment.timestampSeconds)}
      >
        {formatPlaybackTime(comment.timestampSeconds)}
      </button>

      <div className="comment-list-item__body">
        <div className="comment-list-item__meta">
          <strong>{getAuthorLabel(comment)}</strong>
          <span>{formatCreatedDate(comment.createdAt)}</span>
        </div>
        <p>{comment.text}</p>
      </div>

      {canDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void onDelete(comment.id)}
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      ) : null}
    </li>
  );
}
