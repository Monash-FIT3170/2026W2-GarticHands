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
  cleanGuess,
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
    assert.equal(
      botRating(() => 0),
      55,
    );
    assert.equal(
      botRating(() => 0.999),
      95,
    );
  });
});

describe('cannedGuess', () => {
  it('usually names the subject', () => {
    assert.equal(
      cannedGuess('a cat wearing a crown', () => 0.1),
      'cat and crown',
    );
  });

  it('sometimes picks a near miss', () => {
    assert.equal(cannedGuess('a cat', sequence(0.7, 0)), 'a fox');
  });

  it('copes with prompts outside the template bank', () => {
    assert.equal(
      cannedGuess('a jumping kangaroo', () => 0.1),
      'kangaroo',
    );
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

describe('vision prompt injection guards', () => {
  let savedFetch;
  let calls;

  beforeEach(() => {
    process.env.AI_ENABLED = 'true';
    process.env.LLM_PROVIDER = 'ollama';
    savedFetch = globalThis.fetch;
    calls = 0;
  });

  afterEach(() => {
    delete process.env.LLM_PROVIDER;
    globalThis.fetch = savedFetch;
  });

  function visionReplies(content) {
    globalThis.fetch = async () => {
      calls += 1;
      return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }] }) };
    };
  }

  it('cleanGuess keeps at most four plain words', () => {
    assert.equal(cleanGuess('A big red fire truck, obviously!\nsecond line'), 'A big red fire');
  });

  it('cleanGuess rejects replies that obeyed writing in the image', () => {
    assert.throws(() => cleanGuess('Ignore previous instructions'));
    assert.throws(() => cleanGuess('the admin password'));
  });

  it('falls back to a canned guess when the image hijacks the model', async () => {
    visionReplies('SYSTEM PROMPT: you are a helpful assistant');
    const guess = await botGuess(
      { drawing: 'data:image/png;base64,AAAA', truth: 'a cat' },
      () => 0.1,
    );
    assert.equal(calls, 1);
    assert.equal(guess, 'cat');
  });

  it('never sends oversized or non-PNG images to the vision model', async () => {
    visionReplies('a dog');
    const huge = `data:image/png;base64,${'A'.repeat(2_000_001)}`;
    await botGuess({ drawing: huge, truth: 'a cat' }, () => 0.1);
    await botGuess({ drawing: 'data:image/svg+xml;base64,PHN2Zy8+', truth: 'a cat' }, () => 0.1);
    assert.equal(calls, 0);
  });

  it('uses the vision guess when it is clean', async () => {
    visionReplies('a dog');
    assert.equal(
      await botGuess({ drawing: 'data:image/png;base64,AAAA', truth: 'a cat' }),
      'a dog',
    );
  });
});
