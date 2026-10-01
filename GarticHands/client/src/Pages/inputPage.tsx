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
      if (data.status === PhaseConflictStatus) return;

      setError(data.message || 'Failed to submit prompt.');
      setSubmitted(false);
      return;
    }

    if (data.room?.phase === 'draw') {
      void navigate('/draw', { state: { roomCode, playerName } });
    }
  }

  function handleExpire() {
    if (!submitted) void handleSubmit();
  }

  return (
    <div className="background">
      <div className="w-full max-w-2xl flex flex-col items-center">
        <div className="mb-2">
          <RoundHeader
            round={room?.round ?? 1}
            totalRounds={room?.maxRounds ?? 4}
          />
        </div>

        {/* Creative illustration collage */}
        <div className="relative flex items-center justify-center w-full h-60 mb-0">
          {/* Top-left sparkle */}
          <svg
            viewBox="0 0 40 40"
            className="absolute top-4 left-7 w-9 h-9 text-white/75 rotate-[-12deg]"
            aria-hidden="true"
          >
            <path
              d="M20 2 L23 16 L38 20 L23 24 L20 38 L17 24 L2 20 L17 16 Z"
              fill="currentColor"
            />
          </svg>

          {/* Top-right circle */}
          <svg
            viewBox="0 0 50 50"
            className="absolute top-7 right-8 w-10 h-10"
            aria-hidden="true"
          >
            <circle
              cx="25"
              cy="25"
              r="17"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="5"
              strokeDasharray="5 6"
            />
          </svg>

          {/* Left squiggle */}
          <svg
            viewBox="0 0 70 45"
            className="absolute left-0 bottom-8 w-14 h-10 text-white/60"
            aria-hidden="true"
          >
            <path
              d="M3 24 C12 5 22 5 31 24 C40 43 50 43 67 19"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>

          {/* Bottom-right sparkle */}
          <svg
            viewBox="0 0 40 40"
            className="absolute right-5 bottom-5 w-8 h-8 text-white/60 rotate-12"
            aria-hidden="true"
          >
            <path
              d="M20 2 L23 16 L38 20 L23 24 L20 38 L17 24 L2 20 L17 16 Z"
              fill="currentColor"
            />
          </svg>

          {/* Small accent dot */}
          <svg
            viewBox="0 0 24 24"
            className="absolute left-20 top-14 w-5 h-5"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="7" fill="var(--action)" />
          </svg>

          {/* Paint palette */}
          <svg
            viewBox="0 0 100 100"
            className="absolute left-12 top-20 w-20 h-20 -rotate-12 drop-shadow-lg"
            aria-label="Paint palette"
            role="img"
          >
            <path
              d="M51 13
                 C28 13 13 29 13 49
                 C13 70 30 85 50 85
                 C59 85 63 79 61 73
                 C59 67 63 61 71 61
                 L79 61
                 C86 61 90 56 88 48
                 C85 28 70 13 51 13 Z"
              fill="var(--accent)"
            />

            <circle cx="34" cy="36" r="6" fill="var(--action)" />
            <circle cx="53" cy="29" r="6" fill="var(--action-strong)" />
            <circle cx="70" cy="40" r="6" fill="var(--primary)" />
            <circle cx="34" cy="57" r="6" fill="var(--surface)" />
            <circle cx="51" cy="51" r="6" fill="var(--action)" />

            <path
              d="M70 69 C78 72 80 79 75 85"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>

          {/* Lightbulb */}
          <svg
            viewBox="0 0 100 120"
            className="absolute right-14 top-17 w-16 h-20 rotate-12 drop-shadow-lg"
            aria-label="Lightbulb"
            role="img"
          >
            <path
              d="M50 10
                 C29 10 16 26 16 45
                 C16 59 23 68 31 76
                 C35 80 36 86 36 91
                 L64 91
                 C64 86 65 80 69 76
                 C77 68 84 59 84 45
                 C84 26 71 10 50 10 Z"
              fill="var(--accent)"
            />

            <path
              d="M37 91 L63 91 L59 103 L41 103 Z"
              fill="var(--action)"
            />

            <path
              d="M42 108 L58 108"
              stroke="var(--primary)"
              strokeWidth="6"
              strokeLinecap="round"
            />

            <path
              d="M50 25 L50 57"
              stroke="var(--primary)"
              strokeWidth="5"
              strokeLinecap="round"
            />

            <path
              d="M37 39 L50 54 L63 39"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Paintbrush */}
          <svg
            viewBox="0 0 100 180"
            className="absolute left-20 bottom-4 w-14 h-24 rotate-[25deg] drop-shadow-lg"
            aria-label="Paintbrush"
            role="img"
          >
            <rect
              x="40"
              y="48"
              width="20"
              height="92"
              rx="8"
              fill="var(--action)"
            />

            <rect
              x="38"
              y="42"
              width="24"
              height="18"
              rx="5"
              fill="var(--primary)"
            />

            <path
              d="M39 140 L61 140 L68 164
                 C69 171 63 176 50 176
                 C37 176 31 171 32 164 Z"
              fill="var(--accent)"
            />

            <path
              d="M42 42 L58 42 L58 24
                 C58 17 42 17 42 24 Z"
              fill="var(--action-strong)"
            />
          </svg>

          {/* Small paper */}
          <svg
            viewBox="0 0 100 100"
            className="absolute right-24 bottom-7 w-16 h-16 rotate-12 drop-shadow-lg"
            aria-label="Drawing paper"
            role="img"
          >
            <path
              d="M18 12 L68 12 L83 27 L83 88 L18 88 Z"
              fill="rgba(255,255,255,0.94)"
            />

            <path
              d="M68 12 L68 27 L83 27"
              fill="none"
              stroke="rgba(210,235,225,0.95)"
              strokeWidth="7"
            />

            <path
              d="M31 65 C39 50 47 61 53 52 C59 43 65 54 73 44"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>

          {/* Main hand and pencil illustration */}
          <svg
            viewBox="0 0 260 210"
            className="relative z-10 w-60 h-48 drop-shadow-xl"
            aria-label="Hand drawing with a pencil"
            role="img"
          >
            {/* Paper */}
            <path
              d="M61 25
                 C56 21 49 24 49 32
                 L49 151
                 C49 158 54 163 61 163
                 L184 163
                 C191 163 196 158 196 151
                 L196 47
                 C196 40 191 35 184 35
                 L72 35
                 Z"
              fill="rgba(255,255,255,0.94)"
            />

            {/* Folded paper corner */}
            <path
              d="M164 35 L196 67 L164 67 Z"
              fill="rgba(210,235,225,0.95)"
            />

            {/* Drawing on paper */}
            <path
              d="M72 116
                 C84 94 96 97 106 110
                 C117 125 127 86 141 99
                 C152 109 159 92 177 84"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="7"
              strokeLinecap="round"
            />

            {/* Second doodle line */}
            <path
              d="M76 132
                 C90 124 100 140 113 131
                 C126 122 137 139 151 128"
              fill="none"
              stroke="var(--action)"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.75"
            />

            {/* Hand */}
            <path
              d="M78 163
                 C70 153 69 139 76 129
                 L97 100
                 C101 94 109 96 110 102
                 C111 106 109 110 106 114
                 L96 128
                 L102 132
                 L119 106
                 C123 101 130 103 131 109
                 C132 113 130 116 127 120
                 L115 138
                 L122 141
                 L138 119
                 C142 114 149 117 149 123
                 C150 127 148 130 145 134
                 L134 151
                 L142 154
                 C149 157 152 164 148 171
                 L143 181
                 L94 181
                 C87 176 82 170 78 163 Z"
              fill="var(--accent)"
            />

            {/* Pencil */}
            <g transform="rotate(-32 143 108)">
              <rect
                x="132"
                y="36"
                width="17"
                height="87"
                rx="5"
                fill="var(--action)"
              />

              <polygon
                points="132,36 149,36 140.5,20"
                fill="var(--action-strong)"
              />

              <polygon
                points="137,27 144,27 140.5,20"
                fill="var(--primary)"
              />

              <rect
                x="132"
                y="36"
                width="17"
                height="13"
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

        {!submitted && (
          <p className="text-white/60 text-sm font-medium mt-5">
            Your prompt will be passed to another player to draw.
          </p>
        )}
      </div>
    </div>
  );
}