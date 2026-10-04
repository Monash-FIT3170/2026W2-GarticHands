import { describe, it, expect, vi, afterEach } from 'vitest';
import { generatePrompts } from '../src/api/ai';
import { PROMPT_WORDS } from '../src/data/prompts';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubFetch(impl: () => Promise<unknown>) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) });
}

describe('generatePrompts', () => {
  it('posts the request to /ai/prompts and returns the server prompts', async () => {
    const fetchMock = stubFetch(() =>
      jsonResponse({ success: true, prompts: ['koala', 'emu'], source: 'ai' }),
    );

    const batch = await generatePrompts({ theme: 'animals', count: 2, exclude: ['cat'] });

    expect(batch).toEqual({ prompts: ['koala', 'emu'], source: 'ai' });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/ai\/prompts$/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      theme: 'animals',
      count: 2,
      exclude: ['cat'],
    });
  });

  it('defaults count to 10', async () => {
    const fetchMock = stubFetch(() => jsonResponse({ prompts: ['a'], source: 'ai' }));
    await generatePrompts();
    const init = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init[1].body as string)).toEqual({ count: 10 });
  });

  it('drops non-string entries from the server reply', async () => {
    stubFetch(() => jsonResponse({ prompts: ['kite', 3, null, ''], source: 'mixed' }));
    expect(await generatePrompts({ count: 4 })).toEqual({ prompts: ['kite'], source: 'mixed' });
  });

  it('falls back to local prompts when the server is unreachable', async () => {
    stubFetch(() => Promise.reject(new Error('offline')));

    const batch = await generatePrompts({ count: 5 });

    expect(batch.source).toBe('local');
    expect(batch.prompts).toHaveLength(5);
    for (const p of batch.prompts) expect(PROMPT_WORDS).toContain(p);
  });

  it('falls back to local prompts on an HTTP error', async () => {
    stubFetch(() => jsonResponse({}, false));
    expect((await generatePrompts({ count: 3 })).source).toBe('local');
  });

  it('falls back when the server returns no prompts', async () => {
    stubFetch(() => jsonResponse({ success: true, prompts: [] }));
    expect((await generatePrompts({ count: 3 })).source).toBe('local');
  });

  it('local fallback skips excluded words while unused ones remain', async () => {
    stubFetch(() => Promise.reject(new Error('offline')));
    const exclude = PROMPT_WORDS.slice(0, PROMPT_WORDS.length - 3);

    const { prompts } = await generatePrompts({ count: 3, exclude });

    expect([...prompts].sort()).toEqual(PROMPT_WORDS.slice(-3).slice().sort());
  });
});
