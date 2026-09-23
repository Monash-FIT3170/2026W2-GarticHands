import type { ReactNode } from 'react';

type CardVariant = 'lobby' | 'hero' | 'glass';

interface CardProps {
  variant?: CardVariant;
  className?: string;
  children: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  lobby:
    'relative bg-[var(--card-bg)] rounded-xl shadow-lg w-full max-w-4xl px-8 py-8 border-4 border-[var(--card-border)]',
  hero:
    'bg-[var(--hero-bg)] rounded-3xl px-10 py-8 flex flex-col items-center gap-5 w-full max-w-sm shadow-lg',
  glass:
    'relative w-full max-w-sm mx-4 bg-[var(--surface-soft)] border border-[var(--surface-border)] rounded-2xl p-7',
};

export default function Card({ variant = 'glass', className = '', children }: CardProps) {
  return <div className={`${variantClasses[variant]} ${className}`}>{children}</div>;
}