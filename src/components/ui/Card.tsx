import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-[var(--surface)] rounded-xl p-6 shadow-sm border border-[var(--border)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
