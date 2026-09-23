import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'submit'
  | 'start'
  | 'outline'
  | 'ghost'
  | 'ready'
  | 'leave';

type ButtonSize = 'sm' | 'md' | 'lg' | 'full' | 'custom';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean | undefined;
  children: ReactNode;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2',
  md: 'px-5 py-3',
  lg: 'px-6 py-3',
  full: 'w-full max-w-xs py-3',
  custom: '',
};

function variantClasses(
  variant: ButtonVariant,
  active: boolean | undefined,
  disabled: boolean | undefined,
): string {
  switch (variant) {
    case 'primary':
      return 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] rounded-full font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    case 'secondary':
      return 'bg-[var(--surface)] text-[var(--text-primary)] hover:bg-gray-50 rounded-full font-bold border-2 border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    case 'submit':
      return disabled
        ? 'bg-gray-500 text-white rounded-lg font-semibold'
        : 'bg-[var(--success)] hover:bg-[var(--success-hover)] text-white rounded-lg font-semibold';

    case 'start':
      return disabled
        ? 'bg-[var(--disabled-bg)] text-[var(--disabled-text)] cursor-not-allowed rounded-lg font-extrabold'
        : 'bg-[var(--accent)] text-[var(--primary)] hover:bg-[var(--accent-hover)] rounded-lg font-extrabold transition-colors';

    case 'outline':
      return 'bg-[var(--surface)] text-[var(--action)] border-2 border-[var(--action)] hover:bg-orange-50 rounded-lg font-extrabold transition-colors';

    case 'ghost':
      return active
        ? 'bg-[var(--success)] text-white hover:bg-[var(--success-hover)] rounded font-bold'
        : 'bg-gray-500 text-gray-300 rounded font-bold';

    case 'ready':
      if (disabled) {
        return 'bg-[var(--disabled-bg)] text-[var(--disabled-text)] rounded-lg font-extrabold cursor-not-allowed opacity-50';
      }

      return active
        ? 'bg-[var(--accent)] text-[var(--primary)] hover:bg-[var(--accent-hover)] rounded-lg font-extrabold transition-colors'
        : 'bg-[var(--player-bg)] text-[var(--text-muted)] rounded-lg font-extrabold cursor-pointer';

    case 'leave':
      return 'bg-transparent text-white/80 border-2 border-white/40 hover:bg-white/10 hover:text-white rounded-lg font-extrabold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  }
}

export default function Button({
  variant = 'primary',
  size = 'md',
  active,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`${sizeClasses[size]} ${variantClasses(variant, active, disabled)} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}