interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ label = 'Loading', size = 'md' }: LoadingSpinnerProps) {
  return (
    <span className="ui-spinner-wrap" role="status" aria-live="polite">
      <span className={`ui-spinner ui-spinner--${size}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
