import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  tone?: 'default' | 'error';
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  tone = 'default',
  action,
}: EmptyStateProps) {
  return (
    <div className="empty-state" data-tone={tone}>
      <div className="empty-state__marker" />
      <div className="empty-state__copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}
