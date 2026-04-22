import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
}: SectionCardProps) {
  return (
    <section className="section-card">
      <header className="section-card__header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        {action ? <div className="section-card__action">{action}</div> : null}
      </header>

      <div className="section-card__content">{children}</div>
    </section>
  );
}
