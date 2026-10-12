/**
 * Unit tests for bot content: names, prompts, guesses and ratings.
 */
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const {
  BOT_NAMES,
  BOT_PROMPTS,
  nextBotName,
  botRating,
  botGuess,
  cannedGuess,
} = require('../ai/bots');
const { matchTemplates } = require('../ai/drawer');

/** A `random` that returns the given values in turn. */
function sequence(...values) {
  let i = 0;
  return () => values[i++ % values.length];
}

let savedEnv;

beforeEach(() => {
  savedEnv = process.env.AI_ENABLED;
  process.env.AI_ENABLED = 'false';
});

afterEach(() => {
  if (savedEnv === undefined) delete process.env.AI_ENABLED;
  else process.env.AI_ENABLED = savedEnv;
});

describe('nextBotName', () => {
  it('skips names already in the room, case-insensitively', () => {
    assert.equal(nextBotName([]), BOT_NAMES[0]);
    assert.equal(nextBotName([BOT_NAMES[0].toUpperCase()]), BOT_NAMES[1]);
  });

  it('returns null when every name is taken', () => {
    assert.equal(nextBotName(BOT_NAMES), null);
  });
});

describe('bot prompts', () => {
  it('only uses prompts the template drawer can draw', () => {
    for (const prompt of BOT_PROMPTS) {
      assert.ok(matchTemplates(prompt).length > 0, `no template for "${prompt}"`);
    }
  });
});

describe('botRating', () => {
  it('stays inside the 0-100 range the rating endpoint accepts', () => {
    assert.equal(botRating(() => 0), 55);
    assert.equal(botRating(() => 0.999), 95);
  });
});

describe('cannedGuess', () => {
  it('usually names the subject', () => {
    assert.equal(cannedGuess('a cat wearing a crown', () => 0.1), 'cat and crown');
  });

  it('sometimes picks a near miss', () => {
    assert.equal(cannedGuess('a cat', sequence(0.7, 0)), 'a fox');
  });

  it('copes with prompts outside the template bank', () => {
    assert.equal(cannedGuess('a jumping kangaroo', () => 0.1), 'kangaroo');
  });
});

describe('botGuess', () => {
  it('admits there was nothing to guess', async () => {
    assert.equal(await botGuess({ drawing: '', truth: 'a cat' }), 'nothing was drawn!');
  });

  it('guesses without a vision model', async () => {
    const guess = await botGuess(
      { drawing: 'data:image/png;base64,AAAA', truth: 'a rocket' },
      () => 0.1,
    );
    assert.equal(guess, 'rocket');
  });
});
