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

export type GameMode = 'classic' | 'leaderboard';

export type RoomPhase =
  'lobby' | 'prompt' | 'draw' | 'guess' | 'reveal' | 'rating' | 'ratingReveal' | 'leaderboard';

export interface Room {
  code: string;
  players: Player[];
  status: RoomStatus;
  mode: GameMode;
  phase: RoomPhase;
  /**
   * Epoch ms (server clock) at which the current phase auto-advances. `null` for
   * the untimed phases — `lobby`, `reveal`, and `leaderboard`. Pair it with the
   * `serverTime` field on `GET /rooms/:code` rather than the browser clock; see
   * [`../hooks/usePhaseAdvance.ts`](../hooks/usePhaseAdvance.ts).
   */
  phaseEndsAt: number | null;
  round: number;
  maxRounds: number;
  /** Host-selected draw time; optional for room payloads from older servers. */
  drawTimeSeconds?: number;
  prompts: Record<string, string>;
  /**
   * Drawer name → prompt author name. The server assigns which player's prompt
   * each drawer receives at the start of the drawing phase.
   */
  promptTargets?: Record<string, string>;
  drawings: Record<string, string>;
  guesses: Record<string, string>;
  guessTargets?: Record<string, string>;
  /**
   * Rater name → rating target name. The server assigns these targets at the
   * start of each rating phase so every active player rates exactly one other
   * player's drawing.
   */
  ratingTargets?: Record<string, string>;
  /**
   * Rater name → rating given to their assigned player's drawing.
   */
  ratings: Record<string, number>;
  /**
   * Player name → cumulative leaderboard score across completed rounds.
   */
  scores: Record<string, number>;
  createdAt: number;
}

export interface DrawLocationState {
  roomCode?: string;
  playerName?: string;
  room?: Room;
  joinedLate?: boolean;
}

