import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  detail: string;
  tone: 'teal' | 'amber' | 'slate';
}

export function StatCard({ label, value, detail, tone }: StatCardProps) {
  return (
    <article className="stat-card" data-tone={tone}>
      <p className="stat-card__label">{label}</p>
      <strong className="stat-card__value">{value}</strong>
      <span className="stat-card__detail">{detail}</span>
    </article>
  );
}
