import { randomPrompts } from '../data/prompts';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type PromptDifficulty = 'easy' | 'medium' | 'hard';

/** Where a batch of prompts came from. `local` = the server couldn't be reached. */
export type PromptSource = 'ai' | 'mixed' | 'fallback' | 'local';

export interface PromptRequest {
  /** Optional topic, e.g. "Australian animals". Max 60 characters server-side. */
  theme?: string;
  difficulty?: PromptDifficulty;
  /** 1–20. Defaults to 10. */
  count?: number;
  /** Prompts to avoid repeating (already shown or played). */
  exclude?: string[];
}

export interface PromptBatch {
  prompts: string[];
  source: PromptSource;
}

interface PromptResponse {
  success?: boolean;
  prompts?: unknown;
  source?: PromptSource;
}

/**
 * Ask the server's AI prompt generator for fresh prompts. Never rejects: if the
 * server is unreachable or replies with something unexpected, it falls back to
 * the local list in `data/prompts.ts` (skipping excluded words while any are
 * left). The AI key lives on the server only — never call a model from here.
 */
export async function generatePrompts(request: PromptRequest = {}): Promise<PromptBatch> {
  const count = request.count ?? 10;

  try {
    const res = await fetch(`${API_URL}/ai/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, count }),
    });
    if (res.ok) {
      const data = (await res.json()) as PromptResponse;
      const prompts = Array.isArray(data.prompts)
        ? data.prompts.filter((p): p is string => typeof p === 'string' && p.length > 0)
        : [];
      if (prompts.length > 0) return { prompts, source: data.source ?? 'ai' };
    }
  } catch {
    // Network error — fall through to the local list.
  }

  return { prompts: localPrompts(count, request.exclude ?? []), source: 'local' };
}

/** `count` local prompts, preferring ones not in `exclude`. */
function localPrompts(count: number, exclude: string[]): string[] {
  const avoid = new Set(exclude.map((p) => p.toLowerCase()));
  const shuffled = randomPrompts(Number.POSITIVE_INFINITY);
  const fresh = shuffled.filter((p) => !avoid.has(p));
  const used = shuffled.filter((p) => avoid.has(p));
  return [...fresh, ...used].slice(0, Math.max(0, count));
}
