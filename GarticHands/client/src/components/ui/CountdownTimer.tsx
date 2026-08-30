import { useEffect, useRef, useState } from 'react';

interface CountdownTimerProps {
  /** Total seconds to count down from. Used while `secondsLeft` is `null`/absent. */
  seconds: number;
  /**
   * Server-synced seconds remaining. When supplied the component is controlled —
   * it renders this value instead of running its own clock, so every player in
   * the room sees the same number ticking toward the same instant.
   */
  secondsLeft?: number | null;
  /** Frozen when true — used to pause after submit. Also suppresses `onExpire`. */
  paused?: boolean;
  /** Threshold below which the timer turns red. Default: 10. */
  urgentAt?: number;
  /** Called once when the timer hits zero. */
  onExpire?: () => void;
  /** Optional custom label suffix. Default: `s left`. */
  suffix?: string;
}

/**
 * Countdown display used on `/input`, `/draw`, `/guess`. Runs its own clock by
 * default; pass `secondsLeft` to drive it from the room's server-owned phase
 * deadline instead. `paused` freezes it and `onExpire` fires once at zero.
 */
export default function CountdownTimer({
  seconds,
  secondsLeft = null,
  paused = false,
  urgentAt = 10,
  onExpire,
  suffix = 's left',
}: CountdownTimerProps) {
  const [localLeft, setLocalLeft] = useState(seconds);
  const expiredRef = useRef(false);

  const controlled = secondsLeft !== null;
  const timeLeft = controlled ? secondsLeft : localLeft;

  // Fallback local clock, only while no server deadline has arrived yet.
  useEffect(() => {
    if (controlled || paused) return;
    const t = setInterval(() => {
      setLocalLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [controlled, paused]);

  useEffect(() => {
    if (paused || expiredRef.current || timeLeft > 0) return;
    expiredRef.current = true;
    onExpire?.();
  }, [paused, timeLeft, onExpire]);

  const isUrgent = timeLeft <= urgentAt;
  return (
    <span className={`text-sm ${isUrgent ? 'text-red-400' : 'text-black/50'}`}>
      {timeLeft}
      {suffix}
    </span>
  );
}
