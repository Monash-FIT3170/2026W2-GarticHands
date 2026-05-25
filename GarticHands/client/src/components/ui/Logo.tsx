interface LogoProps {
  /** When true, wraps the logo in a `scale-90 -mb-4` shrink used by lobby pages. */
  compact?: boolean
}

/** Wordmark + subtitle pair. Shown at the top of landing and lobby pages. */
export default function Logo({ compact = false }: LogoProps) {
  const inner = (
    <div className="flex flex-col items-center mb-8">
      <img src="/logo.png" alt="GarticHand logo" className="w-52 drop-shadow-md" />
      <img src="/subtitle.png" alt="The Telephone Hand Game" className="h-8 -mt-3" />
    </div>
  )

  if (!compact) return inner
  return <div className="scale-90 -mb-4">{inner}</div>
}
