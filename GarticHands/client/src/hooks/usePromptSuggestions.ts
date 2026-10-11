import { useCallback, useEffect, useRef, useState } from 'react';
import { generatePrompts } from '../api/ai';
import type { PromptDifficulty } from '../api/ai';

interface PromptSuggestionsOptions {
  /** How many suggestions to show at once. */
  count?: number;
  difficulty?: PromptDifficulty;
}

/**
 * A small set of AI prompt ideas for the prompt-writing screen.
 *
 * Loads one batch on mount; `refresh()` swaps it for a new batch that avoids
 * everything already shown. `generatePrompts` never rejects (it falls back to
 * local words), so there is no error state — only `loading`.
 */
export function usePromptSuggestions({
  count = 3,
  difficulty = 'medium',
}: PromptSuggestionsOptions = {}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  // Starts true: the first batch is requested as soon as the hook mounts.
  const [loading, setLoading] = useState(true);
  const shownRef = useRef<string[]>([]);
  /** Bumped per request so a slow, superseded response is ignored. */
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestRef.current;
    const { prompts } = await generatePrompts({
      difficulty,
      count,
      exclude: [...shownRef.current],
    });
    if (id !== requestRef.current) return;
    const next = prompts.slice(0, count);
    shownRef.current.push(...next);
    setSuggestions(next);
    setLoading(false);
  }, [count, difficulty]);

  useEffect(() => {
    void load();
    return () => {
      // Invalidate any in-flight request so it can't set state after unmount.
      requestRef.current += 1;
    };
  }, [load]);

  /** Swap the current suggestions for a fresh batch. */
  const refresh = useCallback(() => {
    setLoading(true);
    return load();
  }, [load]);

  return { suggestions, loading, refresh };
}
