import { useState, type ReactNode } from 'react';
import type { GameMode } from '../types/room';
import { GAMEMODE_ICONS } from './ui/gamemodes';

interface ModeOption {
  key: string;
  title: string;
  description: string;
  icon: ReactNode;
  /** The room settings this mode selects. Playground and Solo have no room. */
  room?: { mode: GameMode; aiMode: boolean };
}

function modeIcon(src: string) {
  return <img src={src} alt="" className="h-16 w-16 object-contain" />;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    key: 'classic',
    title: 'Classic',
    description:
      "Play with friends through a shared drawing challenge. Create prompts, draw what you're given, and guess the results.",
    icon: modeIcon(GAMEMODE_ICONS.classic),
    room: { mode: 'classic', aiMode: false },
  },
  {
    key: 'leaderboard',
    title: 'Showdown',
    description:
      "Compete across multiple rounds. Rate another player's drawing each round and build the highest total score.",
    icon: modeIcon(GAMEMODE_ICONS.showdown),
    room: { mode: 'leaderboard', aiMode: false },
  },
  {
    key: 'ai-classic',
    title: 'AI Classic',
    description:
      'Classic with AI help: AI writes everyone\'s prompts and adds its own guesses. Short on players? Add bots from the player list.',
    icon: modeIcon(GAMEMODE_ICONS.aiClassic),
    room: { mode: 'classic', aiMode: true },
  },
  {
    key: 'ai-showdown',
    title: 'AI Showdown',
    description:
      'Showdown with AI help: AI writes everyone\'s prompts and adds its own guesses. Short on players? Add bots from the player list.',
    icon: modeIcon(GAMEMODE_ICONS.aiShowdown),
    room: { mode: 'leaderboard', aiMode: true },
  },
  {
    key: 'playground',
    title: 'Playground',
    description:
      'Draw whatever you want with no time limit. Experiment freely and take a snapshot of your drawing. Leaves this room.',
    icon: modeIcon(GAMEMODE_ICONS.playground),
  },
  {
    key: 'solo',
    title: 'Solo',
    description:
      'Get an automatically generated prompt and challenge yourself to bring it to life. Leaves this room.',
    icon: modeIcon(GAMEMODE_ICONS.solo),
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
                <span className="mb-2 flex h-16 w-16 items-center justify-center transition-transform group-hover:scale-105">
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
