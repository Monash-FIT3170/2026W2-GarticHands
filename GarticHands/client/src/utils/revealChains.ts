import type { Player, Room } from '../types/room';

export interface RevealChain {
  drawer: Player;
  prompt: string;
  drawing: string;
  guesserName: string;
  guess: string;
}

/**
 * One reveal row per remaining drawer. Mid-round joiners didn't take part in
 * the round — they drew nothing and guessed nothing — so they're excluded,
 * which also keeps the fallback pairing identical to the roster the round
 * started with.
 *
 * Guesses are paired with drawings through `room.guessTargets` — who each guess
 * was actually about, recorded at submission time — so a mid-round departure
 * cannot shift a guess onto the wrong drawing. The original roster index math
 * ("player M guessed player M+1's drawing", i.e. the guesser for the drawer at
 * index `i` sits at index `i − 1`) is kept only as a fallback for guesses that
 * carry no recorded target.
 */
export function buildRevealChains(room: Room): RevealChain[] {
  const players = room.players.filter((p) => !p.joinedMidRound);
  if (players.length === 0) return [];
  const targets = room.guessTargets ?? {};

  return players.map((drawer, i) => {
    const recorded = players.find((p) => targets[p.name] === drawer.name);
    const fallback = players[(i - 1 + players.length) % players.length];
    // Never reattribute a guess that is known to be about a different drawing:
    // the index-math fallback applies only when it has no recorded target.
    const guesser = recorded ?? (targets[fallback.name] === undefined ? fallback : undefined);

    return {
      drawer,
      prompt: room.prompts?.[drawer.name] ?? '',
      drawing: room.drawings?.[drawer.name] ?? '',
      guesserName: guesser?.name ?? 'Nobody',
      guess: guesser ? (room.guesses?.[guesser.name] ?? '') : '',
    };
  });
}
