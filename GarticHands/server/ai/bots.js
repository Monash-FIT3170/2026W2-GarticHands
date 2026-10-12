/**
 * Bot players — what a bot writes, guesses and rates. Timing and room
 * bookkeeping live in `index.js`; this module only decides content, so it can
 * be unit tested without a server.
 *
 * Bots never need an LLM: prompts come from a bank the template drawer can
 * always draw, guesses fall back to a believable near-miss of the real answer,
 * and ratings are random. When a vision model is configured, bots look at
 * human drawings (PNG) properly instead.
 */

const { chat, isAiEnabled } = require('./chat');
const { matchTemplates } = require('./drawer');

const BOT_NAMES = [
  'Bot Pablo',
  'Bot Frida',
  'Bot Vincent',
  'Bot Georgia',
  'Bot Leonardo',
  'Bot Banksy',
  'Bot Hokusai',
];

/** Max bots per room. The room's player cap still applies on top of this. */
const MAX_BOTS = 5;

/**
 * Prompts bots hand out. Every one is concrete, short and covered by the
 * template bank, so it draws well even with AI switched off.
 */
const BOT_PROMPTS = [
  'a cat wearing a crown',
  'a dog wearing a hat',
  'a house and the sun',
  'a fish',
  'a rocket',
  'a snowman',
  'a sailboat',
  'a robot',
  'an umbrella in the rain',
  'a flower',
  'a bird',
  'a coffee mug',
  'the moon and a star',
  'a car',
  'a mountain',
  'a heart',
  'an apple',
  'a king',
];

/** Plausible wrong answers, so bots feel like players rather than oracles. */
const NEAR_MISSES = {
  cat: ['a fox', 'a tiger', 'a dog'],
  dog: ['a bear', 'a lion', 'a monkey'],
  house: ['a barn', 'a shop', 'a tent'],
  sun: ['a flower', 'a star', 'a lion'],
  tree: ['a lollipop', 'broccoli', 'a bush'],
  car: ['a bus', 'a truck', 'a van'],
  fish: ['a whale', 'a submarine', 'a leaf'],
  flower: ['a sun', 'a lollipop', 'a fan'],
  star: ['a starfish', 'a snowflake', 'a sparkle'],
  heart: ['a balloon', 'a leaf', 'a strawberry'],
  robot: ['a TV', 'a fridge', 'a box'],
  rocket: ['a pencil', 'a missile', 'a carrot'],
  boat: ['a ship', 'a pirate ship', 'a bathtub'],
  cloud: ['a sheep', 'smoke', 'a jellyfish'],
  moon: ['a banana', 'a smile', 'a croissant'],
  apple: ['a cherry', 'a tomato', 'a peach'],
  person: ['a stick man', 'a scarecrow', 'a dancer'],
  snowman: ['a bear', 'a snowball', 'a cake'],
  cup: ['a bucket', 'a vase', 'a pot'],
  bird: ['a duck', 'a chicken', 'a plane'],
  mountain: ['a tent', 'a pyramid', 'a volcano'],
  umbrella: ['a mushroom', 'a jellyfish', 'a cane'],
  ball: ['a planet', 'a basketball', 'an orange'],
  crown: ['a castle', 'a fence', 'a hand'],
  hat: ['a cake', 'a chimney', 'a bucket'],
};

const RANDOM_GUESSES = ['a potato', 'modern art', 'a spaceship?', 'my homework', 'a dinosaur'];

const VISION_PROMPT =
  'This sketch is from a Pictionary-style party game; it was drawn in the air with hand tracking, ' +
  'so lines are rough. Make your best guess at what it shows. Reply with 1 to 4 words only, ' +
  'no punctuation, and never say it is unclear.';

function pick(list, random = Math.random) {
  return list[Math.floor(random() * list.length)];
}

/** The first bot name not already taken in `takenNames`, or null when all are used. */
function nextBotName(takenNames) {
  const taken = new Set(takenNames.map((n) => n.toLowerCase()));
  return BOT_NAMES.find((name) => !taken.has(name.toLowerCase())) || null;
}

function botPrompt(random = Math.random) {
  return pick(BOT_PROMPTS, random);
}

/** 1-100 score for Leaderboard mode, biased towards being kind. */
function botRating(random = Math.random) {
  return 55 + Math.floor(random() * 41);
}

/**
 * Guess from the real answer: usually right, sometimes a near miss, now and
 * then something silly. `truth` is the prompt the drawer was given.
 */
function cannedGuess(truth, random = Math.random) {
  const subjects = matchTemplates(truth || '');
  const roll = random();

  if (subjects.length === 0) {
    const words = (truth || '').toLowerCase().match(/[a-z]+/g) || [];
    const noun = words[words.length - 1];
    return noun && roll < 0.6 ? noun : pick(RANDOM_GUESSES, random);
  }

  if (roll < 0.55) return subjects.slice(0, 2).join(' and ');
  if (roll < 0.9) return pick(NEAR_MISSES[subjects[0]] || RANDOM_GUESSES, random);
  return pick(RANDOM_GUESSES, random);
}

/** Ask a vision model about a PNG drawing. Throws on failure. */
async function visionGuess(dataUrl) {
  const reply = await chat(
    [
      {
        role: 'user',
        content: [
          { type: 'text', text: VISION_PROMPT },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
    'vision',
    { json: false, temperature: 0.6 },
  );
  const guess = reply
    .trim()
    .split('\n')[0]
    .replace(/[^\w\s'-]/g, '')
    .trim()
    .slice(0, 40);
  if (!guess) throw new Error('Vision model returned an empty guess');
  return guess;
}

/**
 * A bot's guess for `drawing`. Real hand-drawn PNGs go to the vision model when
 * one is configured; everything else (bot SVGs, no vision model, failures)
 * uses the canned guess so the round never stalls on the network.
 */
async function botGuess({ drawing, truth }, random = Math.random) {
  if (!drawing) return 'nothing was drawn!';

  if (drawing.startsWith('data:image/png') && isAiEnabled('vision')) {
    try {
      return await visionGuess(drawing);
    } catch (err) {
      console.warn(`[ai] bot guess fell back to canned: ${err.message}`);
    }
  }

  return cannedGuess(truth, random);
}

module.exports = {
  BOT_NAMES,
  BOT_PROMPTS,
  MAX_BOTS,
  nextBotName,
  botPrompt,
  botRating,
  botGuess,
  cannedGuess,
};
