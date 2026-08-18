import type { Player } from '../types/room';
import Badge from './ui/Badge';
import Avatar from './ui/Avatar';

interface PlayerListProps {
  players: Player[];
  /** Name of the local viewer. Renders "(you)" / "(You)" next to their entry. */
  selfName?: string;
  /**
   * Visual flavor.
   * - `lobby`: large rounded pills used on the host's lobby page.
   * - `compact`: simple horizontal rows used on the joined-player lobby.
   */
  variant?: 'lobby' | 'compact';
  /** Fill missing rows up to `padTo` slots with empty-state placeholders. */
  padTo?: number;
}

/** Player roster — used on both hosting and joined lobbies. */
export default function PlayerList({
  players,
  selfName,
  variant = 'compact',
  padTo,
}: PlayerListProps) {
  if (variant === 'lobby') {
    const empties = Math.max(0, (padTo ?? players.length) - players.length);
    return (
      <div className="space-y-4 max-h-72 overflow-y-auto pr-3">
        {players.map((player, i) => (
          <LobbyRow key={`p-${i}`} player={player} isSelf={player.name === selfName} />
        ))}
        {Array.from({ length: empties }).map((_, i) => (
          <EmptyLobbyRow key={`e-${i}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {players.map((player, i) => (
        <CompactRow key={`p-${i}`} player={player} isSelf={player.name === selfName} />
      ))}
    </div>
  );
}

function LobbyRow({ player, isSelf }: { player: Player; isSelf: boolean }) {
  const borderClass = isSelf ? 'border-[#78EF57]' : 'border-transparent';
  const rowClasses = `flex items-center gap-4 rounded-full px-4 py-3 border-4 shadow-sm bg-white ${borderClass}`;
  const nameClasses = 'font-bold truncate text-[#D4623E]';

  return (
    <div className={rowClasses}>
      <div className="w-20 flex-shrink-0 flex items-center">
        <Avatar variant={player.isHost ? 'host-row' : 'player-row'} />
      </div>
      <div className="flex-1 min-w-0 text-center">
        <p className={nameClasses}>
          {player.name}
          {/* {isSelf ? ' (You)' : ''} */}
        </p>
      </div>
      <div className="w-20 flex-shrink-0 flex items-center justify-end">
        <Badge tone="lobby" kind={badgeKind(player)} />
      </div>
    </div>
  );
}

function EmptyLobbyRow() {
  return (
    <div className="flex items-center gap-4 rounded-full px-4 py-3 bg-[#79A8A0] border-2 border-[#3D6B64] opacity-80">
      <div className="w-20 flex-shrink-0 flex items-center">
        <Avatar variant="empty-row" />
      </div>
      <p className="flex-1 text-center text-[#C8DDD9] font-bold">Empty</p>
      <div className="w-20 flex-shrink-0" />
    </div>
  );
}

function CompactRow({ player, isSelf }: { player: Player; isSelf: boolean }) {
  return (
    <div className="flex items-center space-x-4 p-3 rounded bg-neutral-700 text-white">
      <div className="flex-1">
        <div className="font-semibold">
          {player.name}
          {isSelf ? ' (you)' : ''}
        </div>
      </div>
      <Badge tone="simple" kind={badgeKind(player)} />
    </div>
  );
}

function badgeKind(player: Player): 'host' | 'ready' | 'waiting' {
  if (player.isHost) return 'host';
  if (player.ready) return 'ready';
  return 'waiting';
}
