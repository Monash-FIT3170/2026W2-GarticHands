import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  RoundHeader,
  CountdownTimer,
} from '../components/ui';
import {
  getRoom,
  submitRating,
  PhaseConflictStatus,
} from '../api/room';
import { usePhaseAdvance } from '../hooks/usePhaseAdvance';
import type { DrawLocationState } from '../types/room';
import BackgroundRays from '../components/ui/BackgroundRays';

/** Shown until the room's server-owned rating deadline arrives. */
const TotalTime = 60;

export default function RatingPage() {
  const location = useLocation();
  const state = location.state as DrawLocationState | null;
  const navigate = useNavigate();

  const roomCode = state?.roomCode;
  const playerName = state?.playerName;

  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState('');
  const [drawing, setDrawing] = useState('');
  const [targetName, setTargetName] = useState('');
  const [round, setRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(4);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomCode || !playerName) {
      void navigate('/');
      return;
    }

    async function loadRoom() {
      const data = await getRoom(roomCode);

      if (!data.success || !data.room) {
        setError('Unable to load the rating.');
        return;
      }

      const ratingTargets: Record<string, string> =
        data.room.ratingTargets ?? {};
      const target: string | undefined = ratingTargets[playerName];

      if (!target) {
        setError('No rating target was assigned.');
        return;
      }

      setTargetName(target);
      setDrawing(data.room.drawings?.[target] || '');
      setRound(data.room.round ?? 1);
      setMaxRounds(data.room.maxRounds ?? 4);
    }

    void loadRoom();
  }, [roomCode, playerName, navigate]);

  const { waitingFor, room, secondsLeft } = usePhaseAdvance({
    roomCode: roomCode ?? '',
    playerName: playerName ?? '',
    enabled: submitted,
    whenPhase: 'ratingReveal',
    to: '/rating-reveal',
    countBucket: 'ratings',
  });

  async function handleSubmit(value = rating) {
    if (submitted || !roomCode || !playerName) return;

    const numericRating = Number(value);

    if (
      value.trim() === '' ||
      !Number.isInteger(numericRating) ||
      numericRating < 0 ||
      numericRating > 100
    ) {
      setError('Please enter a whole number from 0 to 100.');
      return;
    }

    setSubmitted(true);
    setError('');

    const data = await submitRating(
      roomCode,
      playerName,
      numericRating,
    );

    if (!data.success) {
      if (data.status === PhaseConflictStatus) return;

      setError(data.message || 'Failed to submit rating.');
      setSubmitted(false);
      return;
    }

    if (data.room?.phase === 'ratingReveal') {
      void navigate('/rating-reveal', {
        state: { roomCode, playerName },
      });
    }
  }

  function handleExpire() {
    if (!submitted) {
      void handleSubmit(rating || '0');
    }
  }

  function handleRatingChange(value: string) {
    if (value === '') {
      setRating('');
      setError('');
      return;
    }

    const numericValue = Number(value);

    if (!Number.isInteger(numericValue)) return;

    if (numericValue < 0) {
      setRating('0');
      return;
    }

    if (numericValue > 100) {
      setRating('100');
      return;
    }

    setRating(value);
    setError('');
  }

  const displayRound = room?.round ?? round;
  const displayMaxRounds = room?.maxRounds ?? maxRounds;

  return (
    <div className="background !justify-start">
      <BackgroundRays />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-4 py-6">
        <div className="mb-4">
          <RoundHeader
            round={displayRound}
            totalRounds={displayMaxRounds}
          />
        </div>

        <Card
          variant="lobby"
          className="!max-w-3xl !rounded-[22px] !p-6 md:!p-8"
        >
          <div className="flex flex-col items-center">
            <h1 className="text-center text-3xl font-extrabold text-white">
              Rate the Drawing
            </h1>

            <p className="mt-2 text-center text-sm font-semibold text-white/70">
              Give this drawing a score from 0 to 100.
            </p>

            {targetName && (
              <p className="mt-2 text-center text-sm font-bold text-white/50">
                Drawing by {targetName}
              </p>
            )}

            <div className="mt-6 flex min-h-[300px] w-full items-center justify-center overflow-hidden rounded-xl bg-white p-4">
              {drawing ? (
                <img
                  src={drawing}
                  alt={`Drawing by ${targetName}`}
                  className="max-h-[500px] max-w-full object-contain"
                />
              ) : (
                <p className="text-sm font-semibold text-gray-500">
                  Drawing unavailable.
                </p>
              )}
            </div>

            <div className="mt-6 flex w-full max-w-sm flex-col items-center">
              <div className="flex items-center gap-1 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[var(--action)]">
                <span>Time left:</span>

                <CountdownTimer
                  seconds={TotalTime}
                  secondsLeft={secondsLeft}
                  paused={submitted}
                  onExpire={handleExpire}
                  suffix="s"
                  className="!text-[var(--action)]"
                />
              </div>

              <label
                htmlFor="rating"
                className="mt-5 text-sm font-extrabold uppercase tracking-wider text-white"
              >
                Score
              </label>

              <input
                id="rating"
                type="number"
                min="0"
                max="100"
                step="1"
                value={rating}
                onChange={(e) => handleRatingChange(e.target.value)}
                disabled={submitted}
                placeholder="0–100"
                className="mt-2 w-full rounded-full bg-white px-6 py-3 text-center text-2xl font-extrabold text-[var(--action)] outline-none placeholder:text-[var(--action)]/30 focus:ring-2 focus:ring-[var(--action)]/40 disabled:opacity-60"
              />

              <Button
                variant="submit"
                size="full"
                onClick={() => void handleSubmit()}
                disabled={submitted}
                className="mt-4"
              >
                {submitted ? 'Rating Submitted' : 'Submit Rating'}
              </Button>
            </div>

            {submitted && !error && (
              <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
                {waitingFor > 0
                  ? `Waiting for ${waitingFor} other player${
                      waitingFor === 1 ? '' : 's'
                    }...`
                  : 'Showing results...'}
              </p>
            )}

            {error && (
              <p className="mt-4 text-center text-sm text-[var(--action)]">
                {error}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
