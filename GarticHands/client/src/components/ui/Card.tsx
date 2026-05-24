import type { ReactNode } from 'react'

type CardVariant = 'lobby' | 'hero' | 'glass'

interface CardProps {
  /**
   * Visual style.
   * - `lobby`: large dark-teal card with thick brand border (hostingPage).
   * - `hero`:  rounded teal card for landing-style entry (landingPage).
   * - `glass`: translucent white card over a darker background (input, draw, guess).
   */
  variant?: CardVariant
  className?: string
  children: ReactNode
}

const variantClasses: Record<CardVariant, string> = {
  lobby:
    'relative bg-[#5E9990] rounded-xl shadow-lg w-full max-w-4xl px-8 py-8 border-4 border-[#6FADA0]',
  hero:
    'bg-[#559490] rounded-3xl px-10 py-8 flex flex-col items-center gap-5 w-full max-w-sm shadow-lg',
  glass:
    'relative w-full max-w-sm mx-4 bg-white/[0.07] border border-white/[0.14] rounded-2xl p-7',
}

/**
 * Surface container. Pick the variant that matches the page shape; pass `className`
 * for one-off adjustments (e.g. wider max-width on the draw page).
 */
export default function Card({ variant = 'glass', className = '', children }: CardProps) {
  return <div className={`${variantClasses[variant]} ${className}`}>{children}</div>
}
