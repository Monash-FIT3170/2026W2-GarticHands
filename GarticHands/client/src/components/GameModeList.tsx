import { useState, type ReactNode } from 'react';
import type { GameMode } from '../types/room';

interface ModeOption {
  key: string;
  title: string;
  description: string;
  icon: ReactNode;
  /** The room settings this mode selects. Playground and Solo have no room. */
  room?: { mode: GameMode; aiMode: boolean };
}

const aiIcon = <img src="/gamemode_ai_guess.png" alt="" className="h-16 w-16 object-contain" />;

const MODE_OPTIONS: ModeOption[] = [
  {
    key: 'classic',
    title: 'Classic',
    description:
      "Play with friends through a shared drawing challenge. Create prompts, draw what you're given, and guess the results.",
    icon: <img src="/gamemode_classic.png" alt="" className="h-16 w-16 object-contain" />,
    room: { mode: 'classic', aiMode: false },
  },
  {
    key: 'leaderboard',
    title: 'Showdown',
    description:
      "Compete across multiple rounds. Rate another player's drawing each round and build the highest total score.",
    icon: <LeaderboardIcon />,
    room: { mode: 'leaderboard', aiMode: false },
  },
  {
    key: 'ai-classic',
    title: 'AI Classic',
    description:
      'Classic with AI help: AI writes everyone\'s prompts and adds its own guesses. Short on players? Add bots from the player list.',
    icon: aiIcon,
    room: { mode: 'classic', aiMode: true },
  },
  {
    key: 'ai-showdown',
    title: 'AI Showdown',
    description:
      'Showdown with AI help: AI writes everyone\'s prompts and adds its own guesses. Short on players? Add bots from the player list.',
    icon: aiIcon,
    room: { mode: 'leaderboard', aiMode: true },
  },
  {
    key: 'playground',
    title: 'Playground',
    description:
      'Draw whatever you want with no time limit. Experiment freely and take a snapshot of your drawing. Leaves this room.',
    icon: <PlaygroundIcon />,
  },
  {
    key: 'solo',
    title: 'Solo',
    description:
      'Get an automatically generated prompt and challenge yourself to bring it to life. Leaves this room.',
    icon: <SoloIcon />,
  },
];

interface GameModeListProps {
  mode: GameMode;
  aiMode: boolean;
  disabled?: boolean;
  onRoomModeChange: (mode: GameMode, aiMode: boolean) => void;
  /** Playground and Solo have no room, so picking one leaves the lobby. */
  onLaunch: (mode: 'playground' | 'solo') => void;
}

interface Tooltip {
  text: string;
  top: number;
  left: number;
  below: boolean;
}

const TOOLTIP_WIDTH = 256;

/**
 * Scrollable list of game modes for the host lobby. Each row shows only the
 * icon and name; the description appears in a tooltip on hover or focus.
 */
export default function GameModeList({
  mode,
  aiMode,
  disabled = false,
  onRoomModeChange,
  onLaunch,
}: GameModeListProps) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  function showTooltip(option: ModeOption, target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    // Sits to the left of the row so it never hides the neighbouring modes;
    // on narrow screens there is no room, so it drops below the row instead.
    const below = rect.left - 12 < TOOLTIP_WIDTH + 8;
    setTooltip(
      below
        ? { text: option.description, top: rect.bottom + 8, left: rect.left + rect.width / 2, below }
        : { text: option.description, top: rect.top + rect.height / 2, left: rect.left - 12, below },
    );
  }

  function handleClick(option: ModeOption) {
    if (option.room) onRoomModeChange(option.room.mode, option.room.aiMode);
    else onLaunch(option.key === 'playground' ? 'playground' : 'solo');
  }

  return (
    <>
      <ul
        aria-label="Game mode"
        onScroll={() => setTooltip(null)}
        className="flex max-h-[300px] w-full flex-col items-center gap-3 overflow-y-auto overscroll-contain p-1"
      >
        {MODE_OPTIONS.map((option) => {
          const isSelected = option.room?.mode === mode && option.room.aiMode === aiMode;

          return (
            <li key={option.key} className="w-full max-w-[200px] shrink-0">
              <button
                type="button"
                aria-pressed={option.room ? isSelected : undefined}
                aria-description={option.description}
                disabled={disabled}
                onClick={() => handleClick(option)}
                onMouseEnter={(event) => showTooltip(option, event.currentTarget)}
                onMouseLeave={() => setTooltip(null)}
                onFocus={(event) => showTooltip(option, event.currentTarget)}
                onBlur={() => setTooltip(null)}
                className={`
                  group
                  flex w-full flex-col items-center justify-center
                  rounded-lg
                  border-4
                  bg-[var(--surface)]
                  py-3
                  shadow-sm
                  outline-none
                  transition-all
                  focus-visible:ring-4 focus-visible:ring-[var(--accent)]/40
                  disabled:cursor-not-allowed
                  ${
                    isSelected
                      ? 'border-[var(--accent)] ring-4 ring-[var(--accent)]/30'
                      : 'border-[var(--surface)] hover:border-[var(--accent-soft)]'
                  }
                `}
              >
                <span className="mb-2 flex h-16 w-16 items-center justify-center transition-transform group-hover:scale-105 [&>svg]:h-16 [&>svg]:w-16">
                  {option.icon}
                </span>
                <span className="font-extrabold text-[var(--primary)]">{option.title}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {tooltip && (
        <div
          role="tooltip"
          className={`pointer-events-none fixed z-[90] w-64 ${tooltip.below ? '-translate-x-1/2' : '-translate-x-full -translate-y-1/2'} rounded-xl border-2 border-[var(--accent)] bg-[var(--surface)] px-4 py-3 text-sm font-medium leading-relaxed text-[var(--text-secondary)] shadow-2xl`}
          style={{ top: tooltip.top, left: tooltip.left }}
        >
          {tooltip.text}
        </div>
      )}
    </>
  );
}

/* -------------------- Icons -------------------- */

function LeaderboardIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" aria-hidden="true">
      <rect
        x="18"
        y="48"
        width="18"
        height="34"
        rx="4"
        fill="var(--accent-soft)"
        stroke="var(--primary)"
        strokeWidth="3"
      />

      <rect
        x="41"
        y="32"
        width="18"
        height="50"
        rx="4"
        fill="var(--accent)"
        stroke="var(--primary)"
        strokeWidth="3"
      />

      <rect
        x="64"
        y="20"
        width="18"
        height="62"
        rx="4"
        fill="var(--action)"
        stroke="var(--primary)"
        strokeWidth="3"
      />

      <path
        d="M24 40 L31 33 L39 38 L51 24 L59 29 L72 15"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M72 15 L70 24 M72 15 L63 17"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlaygroundIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" aria-hidden="true">
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

      <path d="M17 84 L20 70 L32 82 Z" fill="var(--action)" />

      <path d="M29 66 L41 78" stroke="var(--primary)" strokeWidth="5" />

      <circle cx="29" cy="29" r="8" fill="var(--action)" />

      <path d="M51 14 L54 24 L64 27 L54 30 L51 40 L48 30 L38 27 L48 24 Z" fill="var(--accent)" />
    </svg>
  );
}

function SoloIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12" aria-hidden="true">
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

      <circle cx="53" cy="72" r="4" fill="var(--action)" />

      {/* Small sparkle */}
      <path d="M27 66 L29 72 L35 74 L29 76 L27 82 L25 76 L19 74 L25 72 Z" fill="var(--accent)" />

      {/* Pencil */}
      <g transform="rotate(-38 70 72)">
        <rect x="66" y="57" width="10" height="27" rx="2" fill="var(--action)" />

        <polygon points="66,57 76,57 71,49" fill="var(--action-strong)" />

        <polygon points="69,53 73,53 71,49" fill="var(--primary)" />
      </g>
    </svg>
  );
}
