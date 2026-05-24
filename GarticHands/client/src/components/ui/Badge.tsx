type BadgeTone = 'lobby' | 'simple'
type BadgeKind = 'host' | 'ready' | 'waiting'

interface BadgeProps {
  /** Visual flavor — `lobby` is the colorful hostingPage pill, `simple` is the joinedPage variant. */
  tone?: BadgeTone
  /** Semantic state. */
  kind: BadgeKind
}

const lobbyClasses: Record<BadgeKind, string> = {
  host: 'text-xs font-bold px-3 py-1 rounded-full bg-yellow-200 text-[#D4623E]',
  ready: 'text-xs font-bold px-3 py-1 rounded-full bg-green-200 text-[#2E5534]',
  waiting: 'text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-[#D4623E]',
}

const simpleClass = 'text-xs font-bold px-3 py-0.5 rounded-full'

/** Status pill displayed next to player names. */
export default function Badge({ tone = 'simple', kind }: BadgeProps) {
  if (tone === 'simple') {
    return <span className={simpleClass}>{labelFor(kind)}</span>
  }

  if (kind === 'host') {
    return <span className={lobbyClasses.host}>Host</span>
  }

  return <span className={lobbyClasses[kind]}>{labelFor(kind)}</span>
}

function labelFor(kind: BadgeKind): string {
  switch (kind) {
    case 'host': return 'Host'
    case 'ready': return 'Ready'
    case 'waiting': return 'Waiting'
  }
}
