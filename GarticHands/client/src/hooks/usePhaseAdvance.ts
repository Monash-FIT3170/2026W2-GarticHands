import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRoom } from '../api/room';
import type { Room, RoomPhase } from '../types/room';

/** How often the local countdown recomputes. Finer than the poll so it never visibly stalls. */
const TickMs = 250;

/** Re-base the deadline only past this much drift, so poll jitter doesn't make the seconds bounce. */
const DriftToleranceMs = 1000;

interface UsePhaseAdvanceOptions {
  roomCode: string | undefined;
  playerName: string | undefined;
  /** Only count submissions once this is true. Polling and navigation run regardless. */
  enabled: boolean;
  /** Phase value that triggers navigation. */
  whenPhase: RoomPhase;
  /** Route to navigate to once the phase transitions. */
  to: string;
  /** Bucket name to count how many players have submitted. */
  countBucket?: 'prompts' | 'drawings' | 'guesses';
  /** Polling cadence in ms. Default: 1000. */
  intervalMs?: number;
}

interface UsePhaseAdvanceResult {
  waitingFor: number;
  room: Room | null;
  /**
   * Seconds left before the server force-advances the current phase, or `null`
   * while unknown (first poll pending) or when the phase is untimed.
   */
  secondsLeft: number | null;
}

/**
 * Polls the room every second from mount and navigates to `to` — carrying
 * `{ roomCode, playerName }` — as soon as the room reports `phase === whenPhase`.
 *
 * Navigation is deliberately *not* gated on `enabled`: the server force-advances
 * a phase when its deadline passes, so a player who never submitted still has to
 * follow the room forward instead of being stranded on a dead page.
 *
 * Polling from mount means `room` is always available for things like
 * `<RoundHeader round={room?.round} totalRounds={room?.maxRounds} />` — even before
 * the player has submitted.
 */
export function usePhaseAdvance({
  roomCode,
  playerName,
  enabled,
  whenPhase,
  to,
  countBucket,
  intervalMs = 1000,
}: UsePhaseAdvanceOptions): UsePhaseAdvanceResult {
  const navigate = useNavigate();
  const [waitingFor, setWaitingFor] = useState(0);
  const [room, setRoom] = useState<Room | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  // Deadline expressed on the *local* clock. A ref rather than state so the
  // ticker below doesn't restart on every poll.
  const deadlineRef = useRef<number | null>(null);

  useEffect(() => {
    if (!roomCode) return;

    let cancelled = false;

    async function tick() {
      if (!roomCode) return;
      const data = await getRoom(roomCode);
      if (cancelled || !data.success) return;

      const fresh = data.room as Room;
      setRoom(fresh);
      syncDeadline(deadlineRef, fresh.phaseEndsAt, data.serverTime);

      if (enabled && countBucket) {
        const submitted = Object.values(fresh[countBucket] || {}).filter(
          (v) => v !== undefined && v !== null && v !== '',
        ).length;
        setWaitingFor(Math.max(0, fresh.players.length - submitted));
      }

      if (fresh.phase === whenPhase) {
        cancelled = true;
        void navigate(to, { state: { roomCode, playerName } });
      }
    }

    void tick();
    const interval = setInterval(() => {
      void tick();
    }, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [enabled, roomCode, playerName, whenPhase, to, countBucket, intervalMs, navigate]);

  useEffect(() => {
    function update() {
      const deadline = deadlineRef.current;
      setSecondsLeft(
        deadline === null ? null : Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
      );
    }

    update();
    const ticker = setInterval(update, TickMs);
    return () => clearInterval(ticker);
  }, []);

  return { waitingFor, room, secondsLeft };
}

/**
 * Convert the server's `phaseEndsAt` into a local-clock deadline. Only the two
 * server-side timestamps are subtracted from each other, so a browser clock that
 * is minutes off still counts down the right number of seconds.
 */
function syncDeadline(
  deadlineRef: { current: number | null },
  phaseEndsAt: number | null | undefined,
  serverTime: number | undefined,
) {
  if (!phaseEndsAt || typeof serverTime !== 'number') {
    deadlineRef.current = null;
    return;
  }

  const next = Date.now() + (phaseEndsAt - serverTime);
  const current = deadlineRef.current;
  if (current === null || Math.abs(next - current) > DriftToleranceMs) {
    deadlineRef.current = next;
  }
}
