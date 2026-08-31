import { describe, it, expect } from 'vitest';
import { buildRevealChains } from '../src/utils/revealChains';
import type { Player, Room } from '../src/types/room';

function makePlayer(name: string, joinedAt: number): Player {
  return {
    name,
    status: 'ready',
    isHost: joinedAt === 1,
    ready: true,
    joinedAt,
    lastSeen: joinedAt,
  };
}

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    code: 'ABC123',
    players: [makePlayer('A', 1), makePlayer('B', 2), makePlayer('C', 3)],
    status: 'started',
    phase: 'reveal',
    phaseEndsAt: null,
    round: 1,
    maxRounds: 4,
    prompts: { A: 'a cat', B: 'a dog', C: 'a fish' },
    drawings: { A: 'data:image/png;a', B: 'data:image/png;b', C: 'data:image/png;c' },
    guesses: { A: 'guess-of-B', B: 'guess-of-C', C: 'guess-of-A' },
    guessTargets: { A: 'B', B: 'C', C: 'A' },
    createdAt: 1,
    ...overrides,
  };
}

describe('buildRevealChains', () => {
  it('returns no chains for an empty roster', () => {
    expect(buildRevealChains(makeRoom({ players: [] }))).toEqual([]);
  });

  it('pairs each drawer with the recorded guesser in a full ring', () => {
    const chains = buildRevealChains(makeRoom());

    expect(chains.map((c) => [c.drawer.name, c.guesserName, c.guess])).toEqual([
      ['A', 'C', 'guess-of-A'],
      ['B', 'A', 'guess-of-B'],
      ['C', 'B', 'guess-of-C'],
    ]);
  });

  it('falls back to roster index math when no targets were recorded', () => {
    const chains = buildRevealChains(makeRoom({ guessTargets: undefined }));

    expect(chains.map((c) => [c.drawer.name, c.guesserName])).toEqual([
      ['A', 'C'],
      ['B', 'A'],
      ['C', 'B'],
    ]);
  });

  it('keeps guesses on the right drawings after a mid-round departure', () => {
    // B left after guesses were made: their roster entry, drawing, and guess
    // are gone, but A's guess was about B's (now deleted) drawing and C's was
    // about A's. Index math over [A, C] would hand A's guess to C's drawing.
    const room = makeRoom({
      players: [makePlayer('A', 1), makePlayer('C', 3)],
      drawings: { A: 'data:image/png;a', C: 'data:image/png;c' },
      guesses: { A: 'guess-of-B', C: 'guess-of-A' },
      guessTargets: { A: 'B', C: 'A' },
    });

    const chains = buildRevealChains(room);

    expect(chains.map((c) => [c.drawer.name, c.guesserName, c.guess])).toEqual([
      ['A', 'C', 'guess-of-A'],
      // Nobody still present guessed C's drawing — A's guess about B must not
      // be reattributed to it.
      ['C', 'Nobody', ''],
    ]);
  });

  it('does not use the index-math fallback for a guesser whose recorded target is another drawer', () => {
    // Only A has a recorded target (B). C's guess predates target recording,
    // so C still resolves by index math, but A's guess must never attach to
    // anyone but B.
    const room = makeRoom({
      guesses: { A: 'guess-of-B', C: 'guess-of-A' },
      guessTargets: { A: 'B' },
    });

    const chains = buildRevealChains(room);

    expect(chains.map((c) => [c.drawer.name, c.guesserName, c.guess])).toEqual([
      ['A', 'C', 'guess-of-A'],
      ['B', 'A', 'guess-of-B'],
      ['C', 'B', ''],
    ]);
  });
});
