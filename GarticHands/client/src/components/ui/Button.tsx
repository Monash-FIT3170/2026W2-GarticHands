import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant =
  | 'primary' // landing "Host Game" — dark-green pill
  | 'secondary' // landing "Join Room" — white pill
  | 'submit' // input/draw/guess "Submit" — bright-green rounded-lg
  | 'start' // host "Start Game" — lime-green rounded-lg
  | 'outline' // host "Copy Invite Code" — orange outline
  | 'ghost' // joined "Ready / Not Ready" toggle
  | 'ready'; // joined ready toggle — green when active, teal-grey when inactive

type ButtonSize = 'sm' | 'md' | 'lg' | 'full' | 'custom';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** When the button represents a binary state (ready / not-ready). */
  active?: boolean;
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
      return 'bg-[#2E5534] text-white hover:bg-[#244529] rounded-full font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    case 'secondary':
      return 'bg-white text-[#3D6B64] hover:bg-gray-50 rounded-full font-bold border-2 border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    case 'submit':
      return disabled
        ? 'bg-gray-500 text-white rounded-lg font-semibold'
        : 'bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold';
    case 'start':
      return disabled
        ? 'bg-[#9CC9C1] text-[#47756E] cursor-not-allowed rounded-lg font-extrabold'
        : 'bg-[#78EF57] text-[#2E5534] hover:bg-[#67DD48] rounded-lg font-extrabold transition-colors';
    case 'outline':
      return 'bg-white text-[#D4623E] border-2 border-[#D4623E] hover:bg-orange-50 rounded-lg font-extrabold transition-colors';
    case 'ghost':
      return active
        ? 'bg-green-600 text-white hover:bg-green-700 rounded font-bold'
        : 'bg-gray-500 text-gray-300 rounded font-bold';
    case 'ready':
      if (disabled) {
        return 'bg-[#4a6e69] text-[#8aaba6] rounded-lg font-extrabold cursor-not-allowed opacity-50'
      }
      return active
        ? 'bg-[#78EF57] text-[#2E5534] hover:bg-[#67DD48] rounded-lg font-extrabold transition-colors'
        : 'bg-[#79A8A0] text-[#C8DDD9] rounded-lg font-extrabold cursor-pointer';
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
