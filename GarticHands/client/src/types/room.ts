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
  /**
   * Epoch ms of this player's last poll. The server drops players it hasn't
   * heard from in a while, so the roster reflects who is actually still here.
   */
  lastSeen: number;
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
  /**
   * Guesser name → name of the drawer whose drawing they guessed, recorded when
   * the guess is submitted. The reveal pairs guesses with drawings through this
   * map so a mid-round departure cannot shift a guess onto the wrong drawing.
   * Optional because a guess submitted without a resolved target has no entry.
   */
  guessTargets?: Record<string, string>;
  createdAt: number;
}

export interface DrawLocationState {
  roomCode?: string;
  playerName?: string;
  room?: Room;
}
