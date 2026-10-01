import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, RoundHeader, CountdownTimer } from '../components/ui';
import { submitPrompt, PhaseConflictStatus } from '../api/room';
import { usePhaseAdvance } from '../hooks/usePhaseAdvance';
import type { DrawLocationState } from '../types/room';

const MaxChars = 120;
/** Shown until the room's server-owned deadline arrives. Real limit: `PHASE_DURATIONS` in `server/index.js`. */
const TotalTime = 60;

export default function InputPage() {
  const location = useLocation();
  const state = location.state as DrawLocationState | null;
  const navigate = useNavigate();
  const roomCode = state?.roomCode;
  const playerName = state?.playerName;

  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomCode || !playerName) void navigate('/');
  }, [roomCode, playerName, navigate]);

  const { waitingFor, room, secondsLeft } = usePhaseAdvance({
    roomCode,
    playerName,
    enabled: submitted,
    whenPhase: 'draw',
    to: '/draw',
    countBucket: 'prompts',
  });

  async function handleSubmit() {
    if (!input.trim() || submitted || !roomCode || !playerName) return;

    setSubmitted(true);
    setError('');

    const data = await submitPrompt(roomCode, playerName, input.trim());

    if (!data.success) {
      // Raced the phase deadline: the server already moved everyone on and gave
      // us a fallback prompt. Stay submitted and let the phase poll navigate.
      if (data.status === PhaseConflictStatus) return;

      setError(data.message || 'Failed to submit prompt.');
      setSubmitted(false);
      return;
    }

    if (data.room?.phase === 'draw') {
      void navigate('/draw', { state: { roomCode, playerName } });
    }
  }

  /**
   * Time is up. Send whatever has been typed; an empty box is left to the
   * server, which assigns a fallback prompt when it force-advances.
   */
  function handleExpire() {
    if (!submitted) void handleSubmit();
  }

  return (
    <div className="background">
      <div className="w-full max-w-2xl flex flex-col items-center">
        {/* Round information */}
        <div className="mb-2">
          <RoundHeader
            round={room?.round ?? 1}
            totalRounds={room?.maxRounds ?? 4}
          />
        </div>

        {/* Drawing visual */}
        <div className="relative flex items-center justify-center w-52 h-44 mb-1">
          {/* Decorative doodles */}
          <span className="absolute top-3 left-4 text-3xl text-white/70 rotate-[-15deg]">
            ✦
          </span>

          <span className="absolute top-8 right-3 text-2xl text-white/60 rotate-12">
            •
          </span>

          <span className="absolute bottom-7 left-7 text-2xl text-white/60 rotate-12">
            ✦
          </span>

          <span className="absolute bottom-3 right-8 text-3xl text-white/50 rotate-[-10deg]">
            •
          </span>

          {/* Main drawing */}
          <svg
            viewBox="0 0 220 180"
            className="w-44 h-40 drop-shadow-lg"
            aria-label="Hand drawing with a pencil"
            role="img"
          >
            {/* Paper */}
            <path
              d="M54 24 C50 20 43 23 43 30 L43 135 C43 141 48 145 54 145 L162 145 C168 145 173 140 173 134 L173 38 C173 32 168 28 162 28 Z"
              fill="rgba(255,255,255,0.92)"
            />

            {/* Paper corner */}
            <path
              d="M143 28 L173 58 L143 58 Z"
              fill="rgba(210,235,225,0.9)"
            />

            {/* Doodle on paper */}
            <path
              d="M67 101 C78 83 88 86 96 96 C105 107 113 75 125 86 C135 96 139 80 149 76"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Hand */}
            <path
              d="M74 145 C67 137 66 125 72 117 L91 92
                 C95 87 102 89 103 94
                 C104 97 102 101 100 104
                 L91 116
                 L96 119
                 L111 97
                 C114 92 121 94 122 99
                 C123 102 121 105 119 108
                 L108 124
                 L114 127
                 L128 109
                 C131 105 137 108 137 113
                 C138 116 136 119 134 122
                 L124 136
                 L132 139
                 C138 142 140 148 137 153
                 L132 162
                 L87 162
                 C81 158 77 152 74 145 Z"
              fill="var(--accent)"
            />

            {/* Pencil */}
            <g transform="rotate(-32 121 96)">
              <rect
                x="112"
                y="37"
                width="15"
                height="75"
                rx="4"
                fill="var(--action)"
              />
              <polygon
                points="112,37 127,37 119.5,23"
                fill="var(--action-strong)"
              />
              <rect
                x="112"
                y="37"
                width="15"
                height="12"
                rx="2"
                fill="var(--accent)"
              />
            </g>
          </svg>
        </div>

        {/* Prompt card */}
        <div className="w-full bg-[var(--surface-soft)] border border-white/20 backdrop-blur-md rounded-3xl shadow-2xl px-8 py-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
              Create Your Prompt
            </h1>

            <p className="text-white/75 font-medium mt-2">
              Give another player something fun to draw!
            </p>
          </div>

          <input
            type="text"
            className="
              w-full rounded-2xl px-6 py-5
              bg-white text-[var(--text-primary)]
              placeholder:text-[var(--text-primary)]/40
              font-semibold text-lg
              outline-none
              focus:ring-4 focus:ring-white/30
              transition-shadow
            "
            maxLength={MaxChars}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={submitted}
            placeholder="What should they draw?"
          />

          <div className="flex items-center justify-between mt-5 gap-4">
            <CountdownTimer
              seconds={TotalTime}
              secondsLeft={secondsLeft}
              paused={submitted}
              onExpire={handleExpire}
            />

            <Button
              variant="submit"
              size="md"
              onClick={() => void handleSubmit()}
              disabled={submitted}
            >
              Submit
            </Button>
          </div>

          {submitted && !error && (
            <p className="text-sm text-white/75 font-medium text-center mt-5">
              {waitingFor > 0
                ? `Waiting for ${waitingFor} other player${waitingFor === 1 ? '' : 's'}...`
                : 'Starting drawing phase...'}
            </p>
          )}

          {error && (
            <p className="text-sm text-white font-semibold text-center mt-5">
              {error}
            </p>
          )}
        </div>

        {/* Small transition message */}
        {!submitted && (
          <p className="text-white/60 text-sm font-medium mt-5">
            Your prompt will be passed to another player to draw.
          </p>
        )}
      </div>
    </div>
  );
}