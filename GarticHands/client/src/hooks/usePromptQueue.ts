import { useCallback, useEffect, useRef, useState } from 'react';
import { generatePrompts } from '../api/ai';
import type { PromptDifficulty } from '../api/ai';
import { randomPrompt } from '../data/prompts';

/** Fetch another batch once this few prompts are left in the queue. */
const RefillAt = 3;
const BatchSize = 10;

interface PromptQueueOptions {
  theme?: string;
  difficulty?: PromptDifficulty;
}

/**
 * An endless supply of non-repeating drawing prompts for solo play.
 *
 * Starts instantly with a local word, then keeps a small queue topped up from
 * the AI prompt generator in the background. Every prompt shown is sent back as
 * `exclude`, so the AI doesn't repeat itself. If the server is down,
 * `generatePrompts` falls back to the local list, so `next()` always has
 * something to show.
 */
export function usePromptQueue({ theme, difficulty = 'easy' }: PromptQueueOptions = {}) {
  const [prompt, setPrompt] = useState<string>(() => randomPrompt());
  const queueRef = useRef<string[]>([]);
  const seenRef = useRef<string[]>([]);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  const refill = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const { prompts } = await generatePrompts({
        theme,
        difficulty,
        count: BatchSize,
        exclude: [...seenRef.current, ...queueRef.current],
      });
      if (!mountedRef.current) return;
      const known = new Set([...seenRef.current, ...queueRef.current]);
      queueRef.current.push(...prompts.filter((p) => !known.has(p)));
    } finally {
      loadingRef.current = false;
    }
  }, [theme, difficulty]);

  useEffect(() => {
    mountedRef.current = true;
    void refill();
    return () => {
      mountedRef.current = false;
    };
  }, [refill]);

  /**
   * Retire the current prompt and show the next one. The current prompt is
   * tracked in a ref (not read inside a state updater) because updaters can run
   * twice under StrictMode, which would skip a queued prompt.
   */
  const currentRef = useRef(prompt);
  const next = useCallback(() => {
    seenRef.current.push(currentRef.current);
    const upcoming = queueRef.current.shift() ?? randomPrompt();
    currentRef.current = upcoming;
    setPrompt(upcoming);
    if (queueRef.current.length <= RefillAt) void refill();
  }, [refill]);

  return { prompt, next };
}
