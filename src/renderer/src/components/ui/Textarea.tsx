import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hint, error, id, className, ...props }: TextareaProps) {
  const textareaId = id ?? props.name;
  const message = error ?? hint;

  return (
    <label className="ui-field">
      {label ? <span className="ui-field__label">{label}</span> : null}
      <textarea
        id={textareaId}
        className={['ui-textarea', error ? 'ui-textarea--error' : '', className ?? '']
          .filter(Boolean)
          .join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={message && textareaId ? `${textareaId}-message` : undefined}
        {...props}
      />
      {message ? (
        <span
          id={textareaId ? `${textareaId}-message` : undefined}
          className={error ? 'ui-field__error' : 'ui-field__hint'}
        >
          {message}
        </span>
      ) : null}
    </label>
  );
}
