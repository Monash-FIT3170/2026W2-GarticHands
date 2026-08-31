import { useEffect, useRef } from 'react';
import type { Player } from '../types/room';

/**
 * Calls `onDepart` with the names that disappeared from the roster since the
 * last poll. Lets a lobby say "Bob left the room" while the client is still
 * REST-polling rather than subscribed to the server's `players-left` event.
 *
 * Nothing fires for the first roster it sees — that's arrival, not departure.
 */
export function usePlayerDepartures(players: Player[], onDepart: (names: string[]) => void) {
  const previousRef = useRef<string[] | null>(null);

  useEffect(() => {
    const names = players.map((p) => p.name);
    const previous = previousRef.current;
    previousRef.current = names;
    if (previous === null) return;

    // Callers can pass an inline callback: an identity-only change re-runs this
    // effect, but by then `previous` already equals `names`, so nothing fires.
    const gone = previous.filter((name) => !names.includes(name));
    if (gone.length > 0) onDepart(gone);
  }, [players, onDepart]);
}
