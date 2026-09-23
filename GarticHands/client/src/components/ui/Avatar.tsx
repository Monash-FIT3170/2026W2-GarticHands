import PersonIcon from './icons/PersonIcon';

type AvatarVariant =
  | 'guest'
  | 'host-large'
  | 'host-row'
  | 'player-row'
  | 'empty-row';

interface AvatarProps {
  variant?: AvatarVariant;
  letter?: string;
}

const shellClasses: Record<AvatarVariant, string> = {
  guest:
    'bg-[var(--surface)] rounded-full w-24 h-24 flex items-center justify-center shadow-inner',

  'host-large':
    'absolute -top-14 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-[var(--avatar-bg)] flex items-center justify-center shadow-xl',

  'host-row':
    'w-8 h-8 rounded-full flex items-center justify-center border-2 border-[var(--action)] text-[var(--action)] bg-[var(--surface)]',

  'player-row':
    'w-8 h-8 rounded-full flex items-center justify-center border-2 border-[var(--action)] text-[var(--action)] bg-transparent',

  'empty-row':
    'w-8 h-8 rounded-full flex items-center justify-center border-2 border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--empty-avatar-bg)]',
};

export default function Avatar({ variant = 'guest', letter }: AvatarProps) {
  if (variant === 'host-large') {
    return (
      <div className={shellClasses[variant]}>
        <div className="w-16 h-16 rounded-full bg-[var(--action-strong)] flex items-center justify-center text-white text-4xl font-bold">
          {letter ? letter.toUpperCase() : 'H'}
        </div>
      </div>
    );
  }

  const iconSize =
    variant === 'guest' ? 'w-14 h-14 text-[var(--action)]' : 'w-5 h-5';

  return (
    <div className={shellClasses[variant]}>
      <PersonIcon className={iconSize} />
    </div>
  );
}