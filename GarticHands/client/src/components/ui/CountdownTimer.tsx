import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  /** Total seconds to count down from. */
  seconds: number;
  /** Frozen when true — used to pause after submit. */
  paused?: boolean;
  /** Threshold below which the timer turns red. Default: 10. */
  urgentAt?: number;
  /** Called once when the timer hits zero. */
  onExpire?: () => void;
  /** Optional custom label suffix. Default: `s left`. */
  suffix?: string;
}

/**
 * Countdown display used on `/input`, `/draw`, `/guess`. Keeps its own timer state;
 * pass `paused` to freeze it and `onExpire` for the timeout handler.
 */
export default function CountdownTimer({
  seconds,
  paused = false,
  urgentAt = 10,
  onExpire,
  suffix = 's left',
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (paused) return;
    if (timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const isUrgent = timeLeft <= urgentAt;
  return (
    <span className={`text-sm ${isUrgent ? 'text-red-400' : 'text-black/50'}`}>
      {timeLeft}
      {suffix}
    </span>
  );
}
