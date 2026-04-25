import type { HTMLAttributes, ReactNode } from 'react';

type BadgeTone = 'neutral' | 'teal' | 'amber' | 'violet' | 'danger';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span className={['ui-badge', `ui-badge--${tone}`, className ?? ''].filter(Boolean).join(' ')} {...props}>
      {children}
    </span>
  );
}
