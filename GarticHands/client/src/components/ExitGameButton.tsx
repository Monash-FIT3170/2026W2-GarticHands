import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { leaveRoom } from '../api/room';
import { useRecordings } from '../state/RecordingsContext';
import { Button, Card } from './ui';
import type { DrawLocationState } from '../types/room';

/** In-game routes that get the Exit button. Lobbies already have "Leave Room". */
const EXIT_ROUTES = ['/input', '/draw', '/guess', '/game'];

/**
 * Global "Exit Game" control. Mounted once in `GarticHands.tsx` (inside the router
 * and `RecordingsProvider`), so no page needs to change.
 *
 * It shows itself only on the in-game routes and only when the route carries
 * `roomCode` + `playerName` in `location.state`. Clicking it opens a confirm
 * dialog; confirming reports the departure to the server, clears this player's
 * local recordings, and sends them back to the landing page (`/`).
 *
 * The server handles the rest: a departing host hands the role to the
 * longest-standing remaining player (`removePlayer` → `promoteHost`).
 */
export default function ExitGameButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearRecordings } = useRecordings();
  const [confirming, setConfirming] = useState(false);

  const state = location.state as DrawLocationState | null;
  const roomCode = state?.roomCode;
  const playerName = state?.playerName;

  useEffect(() => {
    if (!confirming) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setConfirming(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirming]);

  const visible = EXIT_ROUTES.includes(location.pathname) && !!roomCode && !!playerName;
  if (!visible) return null;

  function handleExit() {
    if (!roomCode || !playerName) return;
    setConfirming(false);
    // Leave the page first so no in-game poll fires while we're departing,
    // then tell the server. This component stays mounted, so the request
    // still completes after navigation.
    void navigate('/');
    clearRecordings();
    leaveRoom(roomCode, playerName).catch(() => {});
  }

  return (
    <>
      <Button
        variant="leave"
        size="custom"
        onClick={() => setConfirming(true)}
        className="fixed bottom-4 right-4 z-40 px-6 py-3 text-2xl !text-black !border-black"
      >
        Exit Game
      </Button>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setConfirming(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
            <Card variant="lobby" className="!max-w-sm !px-6 !py-6">
              <div role="dialog" aria-modal="true" aria-label="Exit game">
                <h2 className="text-white text-2xl font-extrabold tracking-wide text-center">
                  Exit game?
                </h2>
                <p className="text-white/80 text-sm font-semibold text-center mt-2">
                  You&apos;ll leave the room and return to the start page. Your drawing recordings
                  will be discarded.
                </p>
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="start"
                    size="custom"
                    onClick={() => setConfirming(false)}
                    className="flex-1 px-4 py-3"
                    autoFocus
                  >
                    Stay in Game
                  </Button>
                  <Button
                    variant="outline"
                    size="custom"
                    onClick={handleExit}
                    className="flex-1 px-4 py-3"
                  >
                    Exit Game
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
