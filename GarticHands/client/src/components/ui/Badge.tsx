type BadgeTone = 'lobby' | 'simple';
type BadgeKind = 'host' | 'ready' | 'waiting';

interface BadgeProps {
  tone?: BadgeTone;
  kind: BadgeKind;
}

const lobbyClasses: Record<BadgeKind, string> = {
  host: 'text-xs font-bold px-3 py-1 rounded-full bg-[var(--warning-soft)] text-[var(--warning-text)]',
  ready: 'text-xs font-bold px-3 py-1 rounded-full bg-[var(--success-soft)] text-[var(--primary)]',
  waiting: 'text-xs font-bold px-3 py-1 rounded-full bg-[var(--warning-soft)] text-[var(--warning-text)]',
};

const simpleClass = 'text-xs font-bold px-3 py-0.5 rounded-full';

export default function Badge({ tone = 'simple', kind }: BadgeProps) {
  if (tone === 'simple') {
    return <span className={simpleClass}>{labelFor(kind)}</span>;
  }

  if (kind === 'host') {
    return <span className={lobbyClasses.host}>Host</span>;
  }

  return <span className={lobbyClasses[kind]}>{labelFor(kind)}</span>;
}

function labelFor(kind: BadgeKind): string {
  switch (kind) {
    case 'host':
      return 'Host';
    case 'ready':
      return 'Ready';
    case 'waiting':
      return 'Waiting';
  }
}