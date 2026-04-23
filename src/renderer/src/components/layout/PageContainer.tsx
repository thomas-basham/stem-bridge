import type { ReactNode } from 'react';

interface PageContainerProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageContainer({
  eyebrow,
  title,
  description,
  actions,
  children,
}: PageContainerProps) {
  return (
    <section className="page-container">
      <header className="page-container__header">
        <div className="page-container__heading">
          <p className="page-container__eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>

        {actions ? <div className="page-container__actions">{actions}</div> : null}
      </header>

      <div className="page-container__content">{children}</div>
    </section>
  );
}
