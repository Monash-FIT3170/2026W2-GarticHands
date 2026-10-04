import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePromptQueue } from '../src/hooks/usePromptQueue';
import { PROMPT_WORDS } from '../src/data/prompts';
import type { PromptRequest } from '../src/api/ai';

const { mockGeneratePrompts } = vi.hoisted(() => ({
  mockGeneratePrompts: vi.fn(),
}));

vi.mock('../src/api/ai', () => ({
  generatePrompts: mockGeneratePrompts,
}));

beforeEach(() => {
  let batch = 0;
  mockGeneratePrompts.mockImplementation(() => {
    batch += 1;
    const prompts = Array.from({ length: 10 }, (_, i) => `ai ${batch}-${i}`);
    return Promise.resolve({ prompts, source: 'ai' });
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('usePromptQueue', () => {
  it('starts with a local prompt straight away', () => {
    const { result } = renderHook(() => usePromptQueue());
    expect(PROMPT_WORDS).toContain(result.current.prompt);
  });

  it('fetches a batch on mount and serves it in order', async () => {
    const { result } = renderHook(() => usePromptQueue());
    await waitFor(() => expect(mockGeneratePrompts).toHaveBeenCalledTimes(1));
    await act(async () => {});

    act(() => result.current.next());
    expect(result.current.prompt).toBe('ai 1-0');
    act(() => result.current.next());
    expect(result.current.prompt).toBe('ai 1-1');
  });

  it('refills when the queue runs low and excludes everything already seen', async () => {
    const { result } = renderHook(() => usePromptQueue({ difficulty: 'medium' }));
    await waitFor(() => expect(mockGeneratePrompts).toHaveBeenCalledTimes(1));
    await act(async () => {});
    const first = result.current.prompt;

    // 10 queued; the refill triggers once 3 or fewer remain (after the 7th next).
    for (let i = 0; i < 7; i++) act(() => result.current.next());
    await waitFor(() => expect(mockGeneratePrompts).toHaveBeenCalledTimes(2));

    const request = mockGeneratePrompts.mock.calls[1][0] as PromptRequest;
    expect(request.difficulty).toBe('medium');
    expect(request.exclude).toContain(first);
    expect(request.exclude).toContain('ai 1-0');
    expect(request.exclude).toContain('ai 1-9');
  });

  it('never repeats a prompt across refills', async () => {
    const { result } = renderHook(() => usePromptQueue());
    await waitFor(() => expect(mockGeneratePrompts).toHaveBeenCalled());
    await act(async () => {});

    const shown = new Set<string>([result.current.prompt]);
    for (let i = 0; i < 25; i++) {
      act(() => result.current.next());
      shown.add(result.current.prompt);
      await act(async () => {});
    }
    expect(shown.size).toBe(26);
  });

  it('falls back to a local word if the queue is empty', () => {
    mockGeneratePrompts.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePromptQueue());

    act(() => result.current.next());
    expect(PROMPT_WORDS).toContain(result.current.prompt);
  });
});
