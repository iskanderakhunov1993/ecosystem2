import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, action, children, className = "" }: CardProps) {
  return (
    <section className={`rounded-card border border-border bg-surface p-4 ${className}`}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title && <h3 className="mono-label text-text-dim">{title}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
