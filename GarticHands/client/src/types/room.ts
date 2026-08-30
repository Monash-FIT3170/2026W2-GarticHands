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
  /**
   * True when the player joined while a round was in progress. Mid-round
   * joiners sit out the rest of the current round (they don't gate phase
   * advancement) and become full participants when the next round starts.
   * Optional because rooms created before this field existed omit it.
   */
  joinedMidRound?: boolean;
  joinedAt: number;
}

export type RoomStatus = 'waiting' | 'started';

export type RoomPhase = 'lobby' | 'prompt' | 'draw' | 'guess' | 'reveal';

export interface Room {
  code: string;
  players: Player[];
  status: RoomStatus;
  phase: RoomPhase;
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
  /** Set when the player joined a game that had already started. */
  joinedLate?: boolean;
}
