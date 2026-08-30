import { describe, it, expect, vi, afterEach } from 'vitest';
import { PROMPT_WORDS, randomPrompt, randomPrompts } from '../src/data/prompts';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('randomPrompt', () => {
  it('always returns a word from PROMPT_WORDS', () => {
    for (let i = 0; i < 50; i++) {
      expect(PROMPT_WORDS).toContain(randomPrompt());
    }
  });

  it('picks the first word when Math.random returns 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(randomPrompt()).toBe(PROMPT_WORDS[0]);
  });

  it('picks the last word when Math.random returns just under 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    expect(randomPrompt()).toBe(PROMPT_WORDS[PROMPT_WORDS.length - 1]);
  });
});

describe('randomPrompts', () => {
  it('returns exactly N prompts when N is within the pool size', () => {
    expect(randomPrompts(5)).toHaveLength(5);
  });

  it('returns prompts with no duplicates', () => {
    const picks = randomPrompts(20);
    expect(new Set(picks).size).toBe(picks.length);
  });

  it('only returns words that exist in PROMPT_WORDS', () => {
    const picks = randomPrompts(10);
    for (const p of picks) {
      expect(PROMPT_WORDS).toContain(p);
    }
  });

  it('caps the result at the full pool size when N exceeds it', () => {
    const picks = randomPrompts(PROMPT_WORDS.length + 50);
    expect(picks).toHaveLength(PROMPT_WORDS.length);
    expect(new Set(picks).size).toBe(PROMPT_WORDS.length);
  });

  it('returns an empty array when N is 0', () => {
    expect(randomPrompts(0)).toEqual([]);
  });

  it('does not mutate the exported PROMPT_WORDS array', () => {
    const before = [...PROMPT_WORDS];
    randomPrompts(30);
    expect(PROMPT_WORDS).toEqual(before);
  });
});
