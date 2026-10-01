import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Avatar } from '../components/ui';

type GameMode = 'classic' | 'playground' | 'solo' | 'ai';

export default function LandingPage() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [expandedMode, setExpandedMode] = useState<GameMode | null>(null);

  const canContinue = playerName.trim().length > 0;

  function handleModeSelect(mode: GameMode) {
    if (mode === 'ai') return;

    if (mode === 'classic') {
      setExpandedMode((current) =>
        current === 'classic' ? null : 'classic',
      );
      return;
    }

    if (mode === 'playground') {
      void navigate('/playground');
      return;
    }

    if (mode === 'solo') {
      void navigate('/solo');
    }
  }

  function joinRoom() {
    if (!canContinue) return;

    void navigate('/join', {
      state: { playerName: playerName.trim() },
    });
  }

  function hostRoom() {
    if (!canContinue) return;

    void navigate('/host', {
      state: { playerName: playerName.trim() },
    });
  }

  return (
    <Page variant="centered" logo padding="px-4 py-8">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.7fr] gap-6 items-stretch">

          {/* Profile / username panel */}
          <section
            className="
              bg-white/90
              border border-white/70
              backdrop-blur-md
              rounded-3xl
              shadow-2xl
              p-7 sm:p-8
              flex flex-col
              items-center
              justify-center
              text-center
            "
          >
            <div className="mb-5">
              <Avatar variant="guest" />
            </div>

            <p className="text-[var(--text-secondary)] text-xs font-extrabold uppercase tracking-[0.25em]">
              Welcome, artist
            </p>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--primary)] mt-2">
              Ready to draw?
            </h1>

            <p className="text-[var(--text-secondary)] font-medium mt-2 mb-6 max-w-xs">
              Enter your name and choose how you want to play.
            </p>

            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter username..."
              maxLength={20}
              className="
                w-full
                bg-white
                rounded-2xl
                px-5 py-4
                text-center
                text-[var(--input-text)]
                placeholder:text-[var(--input-placeholder)]
                font-semibold
                border-4 border-[var(--accent)]
                outline-none
                focus:ring-4 focus:ring-[var(--accent)]/20
                focus:border-[var(--accent)]
                transition-all
              "
            />
          </section>

          {/* Game mode panel */}
          <section
            className="
              bg-white/90
              border border-white/70
              backdrop-blur-md
              rounded-3xl
              shadow-2xl
              p-5 sm:p-7
            "
          >
            <div className="text-center mb-5">
              <p className="text-[var(--text-secondary)] text-xs font-extrabold uppercase tracking-[0.25em]">
                Choose your game mode
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GameModeCard
                mode="classic"
                title="Classic"
                description="Play with friends through a shared drawing challenge. Create prompts, draw what you're given, and guess the results."
                icon={<ClassicIcon />}
                expanded={expandedMode === 'classic'}
                disabled={!canContinue}
                onClick={() => handleModeSelect('classic')}
              >
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      joinRoom();
                    }}
                    disabled={!canContinue}
                    className="
                      flex-1
                      bg-white
                      text-[var(--text-primary)]
                      border-2 border-[var(--accent-soft)]
                      rounded-xl
                      px-4 py-3
                      font-extrabold
                      transition-all
                      hover:-translate-y-0.5
                      hover:shadow-lg
                      hover:border-[var(--accent)]
                      disabled:opacity-40
                      disabled:cursor-not-allowed
                    "
                  >
                    Join Room
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      hostRoom();
                    }}
                    disabled={!canContinue}
                    className="
                      flex-1
                      bg-[var(--accent)]
                      text-[var(--primary)]
                      rounded-xl
                      px-4 py-3
                      font-extrabold
                      transition-all
                      hover:-translate-y-0.5
                      hover:shadow-lg
                      hover:bg-[var(--accent-hover)]
                      disabled:opacity-40
                      disabled:cursor-not-allowed
                    "
                  >
                    Host Game
                  </button>
                </div>
              </GameModeCard>

              <GameModeCard
                mode="playground"
                title="Playground"
                description="Draw whatever you want with no time limit. Experiment freely and take a snapshot of your drawing."
                icon={<PlaygroundIcon />}
                onClick={() => handleModeSelect('playground')}
              />

              <GameModeCard
                mode="solo"
                title="Solo"
                description="Get an automatically generated prompt and challenge yourself to bring it to life."
                icon={<SoloIcon />}
                onClick={() => handleModeSelect('solo')}
              />

              <GameModeCard
                mode="ai"
                title="AI Mode"
                description="Play a classic-style drawing game with an AI opponent."
                icon={<AiIcon />}
                comingSoon
                onClick={() => handleModeSelect('ai')}
              />
            </div>
          </section>
        </div>

        <p className="text-white/50 text-xs font-medium text-center mt-5">
          Hover over a mode to learn more.
        </p>
      </div>
    </Page>
  );
}

interface GameModeCardProps {
  mode: GameMode;
  title: string;
  description: string;
  icon: ReactNode;
  expanded?: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
  onClick: () => void;
  children?: ReactNode;
}

function GameModeCard({
  mode,
  title,
  description,
  icon,
  expanded = false,
  disabled = false,
  comingSoon = false,
  onClick,
  children,
}: GameModeCardProps) {
  const isClassic = mode === 'classic';

  return (
    <div
      role="button"
      tabIndex={comingSoon ? -1 : 0}
      aria-disabled={comingSoon || disabled}
      onClick={() => {
        if (!comingSoon) onClick();
      }}
      onKeyDown={(event) => {
        if (
          !comingSoon &&
          (event.key === 'Enter' || event.key === ' ')
        ) {
          event.preventDefault();
          onClick();
        }
      }}
      className={`
        group
        relative
        overflow-hidden
        min-h-[195px]
        rounded-3xl
        p-4
        flex
        flex-col
        items-center
        text-center
        transition-all
        duration-300

        ${
          comingSoon
            ? `
              bg-white/65
              border-4 border-[var(--accent-soft)]/70
              cursor-default
              opacity-70
            `
            : expanded
              ? `
                bg-white
                border-4 border-[var(--accent)]
                shadow-2xl
                ring-2 ring-[var(--accent)]/20
                cursor-pointer
              `
              : disabled && isClassic
                ? `
                  bg-white
                  border-4 border-[var(--accent)]
                  cursor-pointer
                  hover:-translate-y-1
                  hover:shadow-xl
                `
                : `
                  bg-white
                  border-4 border-[var(--accent)]
                  cursor-pointer
                  hover:-translate-y-1
                  hover:shadow-xl
                  hover:border-[var(--accent-hover)]
                `
        }
      `}
    >
      {/* Coming soon badge */}
      {comingSoon && (
        <div className="absolute top-3 right-3 rounded-full bg-[var(--accent-soft)]/40 border border-[var(--accent-soft)] px-3 py-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-secondary)]">
            Coming Soon
          </span>
        </div>
      )}

      {/* Icon */}
      <div
        className={`
          w-16 h-16
          rounded-2xl
          flex items-center justify-center
          bg-[var(--accent-soft)]/35
          border border-[var(--accent-soft)]
          shadow-sm
          transition-all
          duration-300
          ${
            comingSoon
              ? ''
              : 'group-hover:scale-105 group-hover:rotate-2'
          }
        `}
      >
        {icon}
      </div>

      {/* Title */}
      <h2 className="text-2xl font-extrabold text-[var(--primary)] mt-3">
        {title}
      </h2>

      {/* Description */}
      <div
        className={`
          overflow-hidden
          transition-all
          duration-300
          ${
            expanded
              ? 'max-h-32 opacity-100 mt-2'
              : 'max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100 group-hover:mt-2'
          }
        `}
      >
        <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-xs">
          {description}
        </p>
      </div>

      {/* Classic controls */}
      {isClassic && expanded && (
        <div className="w-full mt-4">
          {children}
        </div>
      )}

      {/* Hint */}
      {!expanded && !comingSoon && (
        <div className="mt-auto pt-3 text-[var(--text-secondary)]/60 text-xs font-bold uppercase tracking-widest transition-opacity group-hover:opacity-0">
          {isClassic ? 'Click to choose' : 'Click to play'}
        </div>
      )}
    </div>
  );
}

/* -------------------- Icons -------------------- */

function ClassicIcon() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-12 h-12"
      aria-hidden="true"
    >
      <rect
        x="15"
        y="20"
        width="70"
        height="58"
        rx="10"
        fill="white"
        stroke="var(--primary)"
        strokeWidth="3"
      />

      <path
        d="M29 59 C38 46 45 63 54 49 C61 38 68 51 75 42"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="6"
        strokeLinecap="round"
      />

      <path
        d="M63 72 L78 57"
        stroke="var(--action)"
        strokeWidth="7"
        strokeLinecap="round"
      />

      <path
        d="M76 58 L82 52 L88 58 L82 64 Z"
        fill="var(--accent)"
      />

      <circle
        cx="29"
        cy="34"
        r="5"
        fill="var(--accent)"
      />
    </svg>
  );
}

function PlaygroundIcon() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-12 h-12"
      aria-hidden="true"
    >
      <path
        d="M20 70 L67 23 L79 35 L32 82 L17 84 Z"
        fill="white"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path
        d="M67 23 L75 15 L87 27 L79 35 Z"
        fill="var(--accent)"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      <path
        d="M17 84 L20 70 L32 82 Z"
        fill="var(--action)"
      />

      <path
        d="M29 66 L41 78"
        stroke="var(--primary)"
        strokeWidth="5"
      />

      <circle
        cx="29"
        cy="29"
        r="8"
        fill="var(--action)"
      />

      <path
        d="M51 14 L54 24 L64 27 L54 30 L51 40 L48 30 L38 27 L48 24 Z"
        fill="var(--accent)"
      />
    </svg>
  );
}

function SoloIcon() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-12 h-12"
      aria-hidden="true"
    >
      {/* Prompt card */}
      <rect
        x="19"
        y="17"
        width="62"
        height="68"
        rx="10"
        fill="white"
        stroke="var(--primary)"
        strokeWidth="4"
      />

      {/* Folded corner */}
      <path
        d="M62 17 L81 36 L62 36 Z"
        fill="var(--accent-soft)"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Question mark */}
      <path
        d="M39 43
           C39 34 46 29 53 29
           C61 29 67 34 67 42
           C67 48 63 51 58 54
           C54 56 53 59 53 63"
        fill="none"
        stroke="var(--action)"
        strokeWidth="7"
        strokeLinecap="round"
      />

      <circle
        cx="53"
        cy="72"
        r="4"
        fill="var(--action)"
      />

      {/* Small sparkle */}
      <path
        d="M27 66 L29 72 L35 74 L29 76 L27 82 L25 76 L19 74 L25 72 Z"
        fill="var(--accent)"
      />

      {/* Pencil */}
      <g transform="rotate(-38 70 72)">
        <rect
          x="66"
          y="57"
          width="10"
          height="27"
          rx="2"
          fill="var(--action)"
        />

        <polygon
          points="66,57 76,57 71,49"
          fill="var(--action-strong)"
        />

        <polygon
          points="69,53 73,53 71,49"
          fill="var(--primary)"
        />
      </g>
    </svg>
  );
}

function AiIcon() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-12 h-12"
      aria-hidden="true"
    >
      <rect
        x="20"
        y="22"
        width="60"
        height="54"
        rx="16"
        fill="white"
        stroke="var(--primary)"
        strokeWidth="3"
      />

      <circle
        cx="39"
        cy="47"
        r="6"
        fill="var(--primary)"
      />

      <circle
        cx="61"
        cy="47"
        r="6"
        fill="var(--primary)"
      />

      <path
        d="M38 62 Q50 70 62 62"
        fill="none"
        stroke="var(--action)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <path
        d="M50 22 L50 12"
        stroke="var(--accent)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <circle
        cx="50"
        cy="9"
        r="4"
        fill="var(--accent)"
      />

      <path
        d="M20 43 L12 38 M80 43 L88 38"
        stroke="var(--accent)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

