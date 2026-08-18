import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

export interface Recording {
  round: number;
  blobUrl: string;
  prompt?: string;
  createdAt: number;
}

interface RecordingsContextValue {
  recordings: Recording[];
  /** Saves a recording for the given round, replacing any prior one for the same round. */
  saveRecording: (rec: Recording) => void;
  /** Drops all recordings and revokes their object URLs. Call at end-of-game cleanup. */
  clearRecordings: () => void;
}

const RecordingsContext = createContext<RecordingsContextValue | null>(null);

/**
 * Holds per-round recording blob URLs across navigation. Lives at the app root
 * (mounted in `GarticHands.tsx`) so /draw can push recordings into it and /game
 * can read them back.
 *
 * Local-only: blob URLs never leave the browser. Each player sees only their
 * own recordings.
 */
export function RecordingsProvider({ children }: { children: ReactNode }) {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const urlsRef = useRef<Set<string>>(new Set());

  const saveRecording = useCallback((rec: Recording) => {
    setRecordings((prev) => {
      const filtered = prev.filter((r) => {
        if (r.round !== rec.round) return true;
        // Replacing — revoke the old URL.
        URL.revokeObjectURL(r.blobUrl);
        urlsRef.current.delete(r.blobUrl);
        return false;
      });
      urlsRef.current.add(rec.blobUrl);
      return [...filtered, rec].sort((a, b) => a.round - b.round);
    });
  }, []);

  const clearRecordings = useCallback(() => {
    for (const url of urlsRef.current) URL.revokeObjectURL(url);
    urlsRef.current.clear();
    setRecordings([]);
  }, []);

  return (
    <RecordingsContext.Provider value={{ recordings, saveRecording, clearRecordings }}>
      {children}
    </RecordingsContext.Provider>
  );
}

export function useRecordings() {
  const ctx = useContext(RecordingsContext);
  if (!ctx) {
    throw new Error('useRecordings must be called inside <RecordingsProvider>.');
  }
  return ctx;
}
