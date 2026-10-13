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
  /**
   * Epoch ms of this player's last poll. The server drops players it hasn't
   * heard from in a while, so the roster reflects who is actually still here.
   */
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
  /**
   * Guesser name → name of the drawer whose drawing they guessed, recorded when
   * the guess is submitted. The reveal pairs guesses with drawings through this
   * map so a mid-round departure cannot shift a guess onto the wrong drawing.
   * Optional because a guess submitted without a resolved target has no entry.
   */
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
  /** Set when the player joined a game that had already started. */
  joinedLate?: boolean;
}
