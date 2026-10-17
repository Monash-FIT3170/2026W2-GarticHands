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
  joinedMidRound?: boolean;
  joinedAt: number;
  lastSeen: number;
}

export type RoomStatus = 'waiting' | 'started';

export type RoomPhase = 'lobby' | 'prompt' | 'draw' | 'guess' | 'reveal' | 'rating' | 'ratingReveal' | 'leaderboard';

export type GameMode = 'classic' | 'leaderboard';

export interface Room {
  code: string;
  players: Player[];
  status: RoomStatus;
  phase: RoomPhase;
  mode?: GameMode;
  phaseEndsAt: number | null;
  round: number;
  maxRounds: number;
  drawTimeSeconds?: number;
  aiMode?: boolean;
  aiPrompt?: string | null;
  aiGuess?: string | null;
  aiGuesses?: Record<string, string>;
  prompts: Record<string, string>;
  promptTargets?: Record<string, string>;
  drawings: Record<string, string>;
  guesses: Record<string, string>;
  guessTargets?: Record<string, string>;
  ratings?: Record<string, number>;
  ratingTargets?: Record<string, string>;
  scores?: Record<string, number>;
  createdAt: number;
}

export interface DrawLocationState {
  roomCode?: string;
  playerName?: string;
  room?: Room;
  joinedLate?: boolean;
  mode?: GameMode;
}
