import type { GameMode } from '../../../types/room';
import aiClassic from './gamemode_ai_classic.png';
import aiShowdown from './gamemode_ai_showdown.png';
import classic from './gamemode_classic.png';
import playground from './gamemode_playground.png';
import showdown from './gamemode_showdown.png';
import solo from './gamemode_solo.png';

/** Game mode icons, shared by the host and player lobbies. */
export const GAMEMODE_ICONS = { classic, showdown, aiClassic, aiShowdown, playground, solo };

/** Icon and display name for a room's mode. */
export function roomModeDisplay(mode: GameMode, aiMode: boolean) {
  if (mode === 'leaderboard') {
    return aiMode
      ? { icon: aiShowdown, title: 'AI Showdown' }
      : { icon: showdown, title: 'Showdown' };
  }
  return aiMode ? { icon: aiClassic, title: 'AI Classic' } : { icon: classic, title: 'Classic' };
}
