/**
 * Canonical data shapes mirrored from the server. Update this file when the server's
 * `Room` / `Player` types change — both sides must agree.
 *
 * See [`../../server/index.js`](../../server/index.js) for the server-side source of truth
 * and [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md#data-shapes-canonical) for context.
 */

export type PlayerStatus = 'host' | 'waiting' | 'ready';

export interface Player {
  name: string;
  status: PlayerStatus;
  isHost: boolean;
  ready: boolean;
  joinedAt: number;
}

export type RoomStatus = 'waiting' | 'started';

export type RoomPhase = 'lobby' | 'prompt' | 'draw' | 'guess' | 'reveal';

export interface Room {
  code: string;
  players: Player[];
  status: RoomStatus;
  phase: RoomPhase;
  /**
   * Epoch ms (server clock) at which the current phase auto-advances. `null` for
   * the untimed phases — `lobby` and `reveal`. Pair it with the `serverTime`
   * field on `GET /rooms/:code` rather than the browser clock; see
   * [`../hooks/usePhaseAdvance.ts`](../hooks/usePhaseAdvance.ts).
   */
  phaseEndsAt: number | null;
  round: number;
  maxRounds: number;
  prompts: Record<string, string>;
  drawings: Record<string, string>;
  guesses: Record<string, string>;
  createdAt: number;
}

export interface DrawLocationState {
  roomCode?: string;
  playerName?: string;
  room?: Room;
}
