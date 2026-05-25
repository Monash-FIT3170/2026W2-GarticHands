import PersonIcon from './icons/PersonIcon'

type AvatarVariant =
  | 'guest'        // landing page large white circle with person icon
  | 'host-large'   // hostingPage header — dark shell, orange inner with letter
  | 'host-row'     // host row in player list — orange border + bg
  | 'player-row'   // player row in player list — orange border, transparent bg
  | 'empty-row'    // empty slot in player list — teal border + light teal bg

interface AvatarProps {
  variant?: AvatarVariant
  /** Optional letter displayed instead of the icon (host-large). */
  letter?: string
}

const shellClasses: Record<AvatarVariant, string> = {
  'guest':
    'bg-white rounded-full w-24 h-24 flex items-center justify-center shadow-inner',
  'host-large':
    'absolute -top-14 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-[#2F4542] flex items-center justify-center shadow-xl',
  'host-row':
    'w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#D4623E] text-[#D4623E] bg-white',
  'player-row':
    'w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#D4623E] text-[#D4623E] bg-transparent',
  'empty-row':
    'w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#3D6B64] text-[#3D6B64] bg-[#8EBAB3]',
}

/**
 * Player avatar. The `host-large` variant accepts a `letter` to render the host's initial;
 * other variants render the generic person icon.
 */
export default function Avatar({ variant = 'guest', letter }: AvatarProps) {
  if (variant === 'host-large') {
    return (
      <div className={shellClasses[variant]}>
        <div className="w-16 h-16 rounded-full bg-[#E67B2E] flex items-center justify-center text-white text-4xl font-bold">
          {letter ? letter.toUpperCase() : 'H'}
        </div>
      </div>
    )
  }

  const iconSize = variant === 'guest' ? 'w-14 h-14 text-[#D4623E]' : 'w-5 h-5'
  return (
    <div className={shellClasses[variant]}>
      <PersonIcon className={iconSize} />
    </div>
  )
}
