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
   * True for server-played bots. Bots are always ready, never host, and take
   * their turns on the server — see `server/ai/bots.js`. Optional because
   * rooms created before bots existed omit it.
   */
  isBot?: boolean;
  /**
   * True when the player joined while a round was in progress. Mid-round
   * joiners sit out the rest of the current round (they don't gate phase
   * advancement) and become full participants when the next round starts.
   * Optional because rooms created before this field existed omit it.
   */
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
