import type { PropsWithChildren, ReactNode } from "react";

interface CardProps extends PropsWithChildren {
  title?: string;
  action?: ReactNode;
  className?: string;
}

export function Card({ title, action, className = "", children }: CardProps) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || action) && (
        <header className="card__header">
          {title && <h2 className="card__title">{title}</h2>}
          {action && <div className="card__action">{action}</div>}
        </header>
      )}

      <div className="card__body">{children}</div>
    </section>
  );
}
