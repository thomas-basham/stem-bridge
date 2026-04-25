import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'section' | 'div';
  header?: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
}

export function Card({
  as: Element = 'section',
  header,
  footer,
  padded = true,
  className,
  children,
  ...props
}: CardProps) {
  const classNames = ['ui-card', padded ? 'ui-card--padded' : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <Element className={classNames} {...props}>
      {header ? <div className="ui-card__header">{header}</div> : null}
      <div className="ui-card__body">{children}</div>
      {footer ? <div className="ui-card__footer">{footer}</div> : null}
    </Element>
  );
}
