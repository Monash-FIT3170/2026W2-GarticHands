import { useCallback, useEffect, useRef } from 'react';
import { leaveRoom } from '../api/room';

/**
 * Reports this player's departure to the server so the rest of the room isn't
 * left waiting on them.
 *
 * Returns a `leave()` callback for an explicit "Leave Room" control, and also
 * registers a `pagehide` handler so closing the tab reports the departure
 * immediately instead of falling through to the server's presence timeout.
 * Both paths fire at most once.
 *
 * In-app navigation (lobby → `/input`) does not trigger `pagehide`, so starting
 * a game never looks like leaving one.
 */
export function useLeaveRoom(roomCode: string | undefined, playerName: string | undefined) {
  const leftRef = useRef(false);

  useEffect(() => {
    if (!roomCode || !playerName) return;

    function reportLeave() {
      if (leftRef.current) return;
      leftRef.current = true;
      // keepalive — the page is going away and a normal fetch would be cancelled.
      leaveRoom(roomCode as string, playerName as string, true).catch(() => {});
    }

    window.addEventListener('pagehide', reportLeave);
    return () => window.removeEventListener('pagehide', reportLeave);
  }, [roomCode, playerName]);

  return useCallback(async () => {
    if (!roomCode || !playerName || leftRef.current) return;
    leftRef.current = true;
    await leaveRoom(roomCode, playerName).catch(() => {});
  }, [roomCode, playerName]);
}
