import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, id, className, ...props }: InputProps) {
  const inputId = id ?? props.name;
  const message = error ?? hint;

  return (
    <label className="ui-field">
      {label ? <span className="ui-field__label">{label}</span> : null}
      <input
        id={inputId}
        className={['ui-input', error ? 'ui-input--error' : '', className ?? '']
          .filter(Boolean)
          .join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={message && inputId ? `${inputId}-message` : undefined}
        {...props}
      />
      {message ? (
        <span
          id={inputId ? `${inputId}-message` : undefined}
          className={error ? 'ui-field__error' : 'ui-field__hint'}
        >
          {message}
        </span>
      ) : null}
    </label>
  );
}
