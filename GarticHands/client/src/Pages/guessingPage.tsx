import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, RoundHeader, CountdownTimer } from '../components/ui';
import { getRoom, submitGuess, PhaseConflictStatus } from '../api/room';
import { usePhaseAdvance } from '../hooks/usePhaseAdvance';
import type { Player, DrawLocationState } from '../types/room';

const MaxChars = 120;
/** Shown until the room's server-owned deadline arrives. Real limit: `PHASE_DURATIONS` in `server/index.js`. */
const TotalTime = 60;

export default function GuessingPage() {
  const location = useLocation();
  const state = location.state as DrawLocationState | null;
  const navigate = useNavigate();
  const roomCode = state?.roomCode;
  const playerName = state?.playerName;

  const [guess, setGuess] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [drawing, setDrawing] = useState<string>('');
  // Name of the player whose drawing we're guessing. Submitted alongside the
  // guess so the reveal can pair it with the right drawing even if the roster
  // changes before then.
  const [targetName, setTargetName] = useState<string | undefined>(undefined);
  const drawnBy = targetName ?? '...';
  // The draw phase can time out with nothing submitted, so "no drawing" is a
  // real outcome — distinguish it from "still fetching".
  const [drawingLoaded, setDrawingLoaded] = useState(false);

  useEffect(() => {
    if (!roomCode || !playerName) {
      void navigate('/');
      return;
    }

    // Pick the player whose drawing we'll guess: the next player in the player list,
    // wrapping around. Deterministic across clients because the list order is shared.
    // Mid-round joiners have no drawing, so they're excluded from the rotation.
    void getRoom(roomCode).then((data) => {
      if (!data.success || !data.room) return;
      const players: Player[] = data.room.players.filter(
        (p) => !p.joinedMidRound,
      );
      const myIndex = players.findIndex((p) => p.name === playerName);
      if (myIndex === -1) return;
      const target = players[(myIndex + 1) % players.length];
      setTargetName(target.name);
      setDrawing((data.room.drawings && data.room.drawings[target.name]) || '');
      setDrawingLoaded(true);
    });
  }, [roomCode, playerName, navigate]);

  const { waitingFor, room, secondsLeft } = usePhaseAdvance({
    roomCode,
    playerName,
    enabled: submitted,
    whenPhase: 'reveal',
    to: '/game',
    countBucket: 'guesses',
  });

  /** `allowEmpty` is only set by the deadline handler — the button requires text. */
  async function handleSubmit(allowEmpty = false) {
    const trimmed = guess.trim();
    if ((!trimmed && !allowEmpty) || submitted || !roomCode || !playerName)
      return;

    setSubmitted(true);
    setError('');

    const data = await submitGuess(
      roomCode,
      playerName,
      trimmed,
      targetName,
    );

    if (!data.success) {
      // Raced the phase deadline: the server already moved everyone on and
      // recorded a blank guess. Stay submitted and let the phase poll navigate.
      if (data.status === PhaseConflictStatus) return;
      setError(data.message || 'Failed to submit guess.');
      setSubmitted(false);
      return;
    }

    if (data.room?.phase === 'reveal') {
      void navigate('/game', { state: { roomCode, playerName } });
    }
  }

  /** Time is up — submit whatever is typed, blank included, so the round advances. */
  function handleExpire() {
    if (!submitted) void handleSubmit(true);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-6 sm:py-8 bg-[var(--page-bg)] relative overflow-hidden"
      style={{ background: 'var(--page-gradient)' }}
    >
      {/* Left decorative doodles */}
      <div className="hidden lg:block absolute left-[5%] top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          viewBox="0 0 180 420"
          className="w-36 h-80 opacity-80"
          aria-hidden="true"
        >
          {/* Pencil */}
          <g transform="rotate(-18 65 90)">
            <path
              d="M42 35 L70 7 L100 37 L72 65 Z"
              fill="white"
              stroke="var(--primary)"
              strokeWidth="4"
            />
            <path
              d="M42 35 L30 48 L59 77 L72 65 Z"
              fill="var(--accent)"
              stroke="var(--primary)"
              strokeWidth="4"
            />
            <path
              d="M30 48 L23 69 L44 62 Z"
              fill="var(--action)"
              stroke="var(--primary)"
              strokeWidth="3"
            />
            <path
              d="M70 7 L83 -6 L113 24 L100 37 Z"
              fill="var(--accent-soft)"
              stroke="var(--primary)"
              strokeWidth="4"
            />
          </g>

          {/* Sparkles */}
          <path
            d="M116 155 L120 168 L133 172 L120 176 L116 190 L112 176 L99 172 L112 168 Z"
            fill="var(--accent)"
          />
          <path
            d="M48 235 L51 244 L60 247 L51 250 L48 260 L45 250 L36 247 L45 244 Z"
            fill="var(--action)"
          />

          {/* Squiggle */}
          <path
            d="M30 315 C45 290 62 340 78 315 C94 290 110 340 128 312"
            fill="none"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Small circle */}
          <circle
            cx="132"
            cy="365"
            r="14"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="5"
          />
        </svg>
      </div>

      {/* Right decorative doodles */}
      <div className="hidden lg:block absolute right-[5%] top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          viewBox="0 0 180 420"
          className="w-36 h-80 opacity-80"
          aria-hidden="true"
        >
          {/* Question mark */}
          <path
            d="M65 85 C65 55 108 52 116 78 C123 101 101 111 89 121 C81 128 80 135 80 143"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx="80" cy="163" r="5" fill="var(--accent)" />

          {/* Little drawing canvas */}
          <rect
            x="38"
            y="205"
            width="95"
            height="70"
            rx="12"
            fill="white"
            stroke="var(--primary)"
            strokeWidth="4"
          />
          <path
            d="M52 252 C64 230 72 255 82 238 C91 223 100 244 118 224"
            fill="none"
            stroke="var(--action)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="58" cy="222" r="6" fill="var(--accent)" />

          {/* Stars */}
          <path
            d="M35 325 L39 338 L52 342 L39 346 L35 359 L31 346 L18 342 L31 338 Z"
            fill="var(--accent)"
          />
          <path
            d="M120 350 L123 359 L132 362 L123 365 L120 374 L117 365 L108 362 L117 359 Z"
            fill="var(--action)"
          />

          {/* Curved doodle */}
          <path
            d="M50 390 C70 370 88 410 112 388"
            fill="none"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <Card
        variant="glass"
        className="
          relative
          z-10
          w-full
          max-w-2xl
          bg-white/90
          border-4
          border-[var(--accent)]
          rounded-3xl
          shadow-2xl
          p-5
          sm:p-6
        "
      >
        <RoundHeader
          round={room?.round ?? 1}
          totalRounds={room?.maxRounds ?? 4}
        />

        <div className="text-center">
          <p className="text-[var(--text-secondary)] text-xs font-extrabold uppercase tracking-[0.25em] mt-3">
            Your turn to guess
          </p>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--primary)] mt-2">
            Guess the Drawing
          </h1>

          <div className="inline-flex items-center gap-2 mt-3 mb-5 px-4 py-2 rounded-full bg-[var(--accent-soft)]/30 border-2 border-[var(--accent)]">
            <span className="text-sm font-bold text-[var(--text-secondary)]">
              Drawn by
            </span>
            <span className="text-sm font-extrabold text-[var(--primary)]">
              {drawnBy}
            </span>
          </div>
        </div>

        {/* Drawing */}
        {drawing ? (
          <div className="w-full h-48 sm:h-56 bg-white rounded-2xl border-4 border-[var(--accent)] shadow-sm mb-4 flex items-center justify-center overflow-hidden">
            <img
              src={drawing}
              alt={`Drawing by ${drawnBy}`}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-full h-48 sm:h-56 bg-white rounded-2xl border-4 border-[var(--accent)] shadow-sm mb-4 flex items-center justify-center text-sm text-[var(--text-secondary)] text-center px-4">
            {drawingLoaded
              ? `${drawnBy} ran out of time — no drawing`
              : 'Loading drawing...'}
          </div>
        )}

        {/* Timer */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center rounded-full bg-[var(--primary)] border-2 border-[var(--primary)] shadow-md px-4 py-2">
            <CountdownTimer
              seconds={TotalTime}
              secondsLeft={secondsLeft}
              paused={submitted}
              onExpire={handleExpire}
              suffix=" seconds left"
            />
          </div>
        </div>

        {/* Guess input */}
        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          maxLength={MaxChars}
          placeholder="What is this drawing?"
          disabled={submitted}
          className="
            w-full
            bg-white
            rounded-2xl
            px-5
            py-3.5
            text-center
            text-[var(--input-text)]
            placeholder:text-[var(--input-placeholder)]
            font-semibold
            border-4
            border-[var(--accent)]
            outline-none
            focus:ring-4
            focus:ring-[var(--accent)]/20
            focus:border-[var(--accent)]
            transition-all
            disabled:opacity-60
          "
        />

        {/* Submit */}
        <div className="flex justify-center mt-4">
          <Button
            variant="submit"
            size="sm"
            onClick={() => void handleSubmit()}
            disabled={!guess.trim() || submitted}
          >
            Submit Guess
          </Button>
        </div>

        {/* Waiting state */}
        {submitted && !error && (
          <div className="flex justify-center mt-4">
            <p className="text-sm font-bold text-[var(--text-secondary)] bg-[var(--accent-soft)]/30 border-2 border-[var(--accent)] rounded-full px-4 py-2 text-center">
              {waitingFor > 0
                ? `Waiting for ${waitingFor} other player${
                    waitingFor === 1 ? '' : 's'
                  }...`
                : 'Revealing results...'}
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm font-bold text-[var(--action)] mt-3 text-center">
            {error}
          </p>
        )}
      </Card>
    </div>
  );
}