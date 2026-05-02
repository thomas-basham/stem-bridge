import { useState, type FormEvent } from 'react';
import { Button, Textarea } from '@/components/ui';
import { formatPlaybackTime } from '@/lib/time';

interface AddCommentFormProps {
  currentTimeSeconds: number;
  disabled?: boolean;
  onSubmit: (payload: { text: string; timestampSeconds: number }) => Promise<void>;
}

export function AddCommentForm({
  currentTimeSeconds,
  disabled = false,
  onSubmit,
}: AddCommentFormProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!text.trim()) {
      setErrorMessage('Enter a comment before posting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit({
        text: text.trim(),
        timestampSeconds: Number(currentTimeSeconds.toFixed(3)),
      });
      setText('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to post comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="add-comment-form" onSubmit={handleSubmit}>
      <Textarea
        label={`Add comment at ${formatPlaybackTime(currentTimeSeconds)}`}
        name="comment"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Leave timestamped feedback for this version"
        disabled={disabled || isSubmitting}
      />

      {errorMessage ? (
        <p className="add-comment-form__error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <Button type="submit" disabled={disabled || isSubmitting}>
        {isSubmitting ? 'Posting...' : 'Post Comment'}
      </Button>
    </form>
  );
}
