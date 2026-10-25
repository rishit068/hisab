import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-[var(--surface)] rounded-2xl p-6 card-shadow border border-[var(--border)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
