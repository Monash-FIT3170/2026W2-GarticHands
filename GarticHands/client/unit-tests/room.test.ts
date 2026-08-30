import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createRoom,
  joinRoom,
  getRoom,
  updateReady,
  startRoom,
  submitPrompt,
  submitDrawing,
  submitGuess,
  restartRoom,
  endRoom,
} from '../src/api/room';

interface FetchCallOptions {
  method?: string;
  body?: string;
}
type FetchCall = [url: string, options?: FetchCallOptions];

function mockFetchOnce(responseBody: unknown) {
  const json = vi.fn().mockResolvedValue(responseBody);
  // `status` matters to the submit helpers, which surface it so callers can
  // tell a phase-deadline 409 apart from a real failure.
  const fetchMock = vi.fn().mockResolvedValue({ json, status: 200 });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('api/room', () => {
  it('createRoom POSTs hostName and returns the parsed JSON', async () => {
    const fetchMock = mockFetchOnce({ roomCode: 'ABCD' });

    const result = await createRoom('Alice');

    const [url, options] = fetchMock.mock.calls[0] as FetchCall;
    expect(url).toContain('/rooms/create');
    expect(options?.method).toBe('POST');
    expect(JSON.parse(options?.body ?? '{}')).toEqual({ hostName: 'Alice' });
    expect(result).toEqual({ roomCode: 'ABCD' });
  });

  it('joinRoom POSTs roomCode and playerName', async () => {
    const fetchMock = mockFetchOnce({ ok: true });

    await joinRoom('ABCD', 'Bob');

    const [url, options] = fetchMock.mock.calls[0] as FetchCall;
    expect(url).toContain('/rooms/join');
    expect(options?.method).toBe('POST');
    expect(JSON.parse(options?.body ?? '{}')).toEqual({ roomCode: 'ABCD', playerName: 'Bob' });
  });

  it('getRoom GETs the room by code with no body', async () => {
    const fetchMock = mockFetchOnce({ players: [] });

    await getRoom('ABCD');

    const [url, options] = fetchMock.mock.calls[0] as FetchCall;
    expect(url).toContain('/rooms/ABCD');
    expect(options).toBeUndefined();
  });

  it('updateReady PATCHes playerName and ready state', async () => {
    const fetchMock = mockFetchOnce({ ok: true });

    await updateReady('ABCD', 'Bob', true);

    const [url, options] = fetchMock.mock.calls[0] as FetchCall;
    expect(url).toContain('/rooms/ABCD/ready');
    expect(options?.method).toBe('PATCH');
    expect(JSON.parse(options?.body ?? '{}')).toEqual({ playerName: 'Bob', ready: true });
  });

  it('startRoom PATCHes with no body', async () => {
    const fetchMock = mockFetchOnce({ phase: 'input' });

    await startRoom('ABCD');

    const [url, options] = fetchMock.mock.calls[0] as FetchCall;
    expect(url).toContain('/rooms/ABCD/start');
    expect(options?.method).toBe('PATCH');
    expect(options?.body).toBeUndefined();
  });

  it('submitPrompt POSTs playerName and prompt', async () => {
    const fetchMock = mockFetchOnce({ ok: true });

    await submitPrompt('ABCD', 'Bob', 'a flying toaster');

    const [url, options] = fetchMock.mock.calls[0] as FetchCall;
    expect(url).toContain('/rooms/ABCD/prompts');
    expect(JSON.parse(options?.body ?? '{}')).toEqual({
      playerName: 'Bob',
      prompt: 'a flying toaster',
    });
  });

  it('submitDrawing POSTs playerName and dataUrl', async () => {
    const fetchMock = mockFetchOnce({ ok: true });

    await submitDrawing('ABCD', 'Bob', 'data:image/png;base64,xyz');

    const [url, options] = fetchMock.mock.calls[0] as FetchCall;
    expect(url).toContain('/rooms/ABCD/drawings');
    expect(JSON.parse(options?.body ?? '{}')).toEqual({
      playerName: 'Bob',
      dataUrl: 'data:image/png;base64,xyz',
    });
  });

  it('submitGuess POSTs playerName and guess', async () => {
    const fetchMock = mockFetchOnce({ ok: true });

    await submitGuess('ABCD', 'Bob', 'a toaster with wings');

    const [url, options] = fetchMock.mock.calls[0] as FetchCall;
    expect(url).toContain('/rooms/ABCD/guesses');
    expect(JSON.parse(options?.body ?? '{}')).toEqual({
      playerName: 'Bob',
      guess: 'a toaster with wings',
    });
  });

  it('restartRoom PATCHes /restart with no body', async () => {
    const fetchMock = mockFetchOnce({ ok: true });

    await restartRoom('ABCD');

    const [url, options] = fetchMock.mock.calls[0] as FetchCall;
    expect(url).toContain('/rooms/ABCD/restart');
    expect(options?.method).toBe('PATCH');
  });

  it('endRoom PATCHes /end with no body', async () => {
    const fetchMock = mockFetchOnce({ ok: true });

    await endRoom('ABCD');

    const [url, options] = fetchMock.mock.calls[0] as FetchCall;
    expect(url).toContain('/rooms/ABCD/end');
    expect(options?.method).toBe('PATCH');
  });

  it('propagates a rejected .json() parse failure instead of swallowing it', async () => {
    const json = vi.fn().mockRejectedValue(new Error('invalid json'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json }));

    await expect(getRoom('ABCD')).rejects.toThrow('invalid json');
  });
});
