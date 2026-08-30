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
