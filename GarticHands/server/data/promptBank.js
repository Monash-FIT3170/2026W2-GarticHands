/**
 * Static prompt bank: the fallback whenever AI prompt generation is off or fails.
 *
 * `EASY_WORDS` mirrors `client/src/data/prompts.ts` (PROMPT_WORDS). It is
 * duplicated rather than imported on purpose: the server is plain CommonJS and
 * must not import client code. Keep the two lists roughly in step.
 *
 * Difficulty levels match the AI prompt generator:
 *   easy   — everyday objects (single nouns)
 *   medium — scenes or actions
 *   hard   — compound, surreal ideas
 */

const EASY_WORDS = [
  'cat',
  'dog',
  'fish',
  'snake',
  'butterfly',
  'octopus',
  'elephant',
  'pig',
  'penguin',
  'frog',
  'bird',
  'whale',
  'bee',
  'snail',
  'turtle',
  'apple',
  'banana',
  'pizza',
  'cake',
  'donut',
  'ice cream',
  'burger',
  'taco',
  'cherry',
  'grapes',
  'carrot',
  'mushroom',
  'cookie',
  'sandwich',
  'sushi',
  'chair',
  'lamp',
  'clock',
  'bed',
  'mug',
  'fork',
  'spoon',
  'plate',
  'pillow',
  'book',
  'pencil',
  'scissors',
  'glasses',
  'umbrella',
  'key',
  'tree',
  'cloud',
  'sun',
  'moon',
  'star',
  'flower',
  'leaf',
  'mountain',
  'rainbow',
  'snowflake',
  'lightning',
  'wave',
  'fire',
  'cactus',
  'mushroom cloud',
  'car',
  'bicycle',
  'rocket',
  'boat',
  'plane',
  'train',
  'bus',
  'submarine',
  'hot air balloon',
  'scooter',
  'eye',
  'hand',
  'foot',
  'smile',
  'heart',
  'ear',
  'tooth',
  'skull',
  'brain',
  'lips',
  'ball',
  'kite',
  'dice',
  'guitar',
  'drum',
  'football',
  'tennis racket',
  'skateboard',
  'piano',
  'puzzle',
  'house',
  'castle',
  'lighthouse',
  'tent',
  'church',
  'bridge',
  'arrow',
  'crown',
  'sword',
  'shield',
]

/** The server's original FALLBACK_PROMPTS come first, so behaviour without AI is unchanged in spirit. */
const MEDIUM_PROMPTS = [
  'a cat wearing a crown',
  'a rocket made of bananas',
  'a robot walking a dog',
  'a haunted teapot',
  'a penguin on a skateboard',
  'a tree growing lightbulbs',
  'a snail racing a train',
  'a castle floating on a cloud',
  'a dog flying a kite',
  'a fish in a bathtub',
  'a snowman at the beach',
  'a bear eating pancakes',
  'a frog playing guitar',
  'a pig in a puddle',
  'a giraffe in a hat',
  'a whale blowing bubbles',
  'a cow jumping a fence',
  'an owl reading a book',
  'a duck with an umbrella',
  'a horse riding a bike',
  'a dragon toasting marshmallows',
  'a ghost brushing its teeth',
  'a bee carrying a bucket',
  'a turtle with a jetpack',
  'an elephant on a seesaw',
  'a monkey juggling bananas',
  'a pirate ship in a bottle',
  'a chef flipping pancakes',
  'a boy chasing a balloon',
  'a cat fishing from a boat',
  'a moon wearing sunglasses',
  'a cactus giving a hug',
]

const HARD_PROMPTS = [
  'a volcano making popcorn',
  'a library inside a whale',
  'a clock melting in the sun',
  'a city built on a turtle',
  'a robot dreaming of sheep',
  'a mermaid at a bus stop',
  'a knight afraid of a mouse',
  'a tornado full of socks',
  'an astronaut gardening on the moon',
  'a submarine in a teacup',
  'a lighthouse guarding a desert',
  'a wizard stuck in traffic',
  'a giant using a car as a skateboard',
  'a crocodile at the dentist',
  'a sandcastle under siege by crabs',
  'a snowstorm inside a snow globe',
  'an octopus directing an orchestra',
  'a time traveller meeting a dinosaur',
  'a chess game between two cats',
  'a tree house in a rain cloud',
]

const PROMPT_BANK = {
  easy: EASY_WORDS,
  medium: MEDIUM_PROMPTS,
  hard: HARD_PROMPTS,
}

/**
 * Pick up to `count` distinct prompts for `difficulty`, skipping anything in
 * `exclude` (a Set of lowercase strings). If the bank runs dry the exclusion is
 * relaxed, so the caller still gets `count` items (repeats only once every
 * prompt has been used).
 */
function pickFromBank(difficulty, count, exclude = new Set()) {
  const bank = PROMPT_BANK[difficulty] || EASY_WORDS
  const fresh = shuffle(bank.filter((p) => !exclude.has(p)))
  const used = shuffle(bank.filter((p) => exclude.has(p)))
  return [...fresh, ...used].slice(0, Math.max(0, count))
}

/** Fisher–Yates shuffle into a new array. */
function shuffle(items) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

module.exports = { PROMPT_BANK, EASY_WORDS, MEDIUM_PROMPTS, HARD_PROMPTS, pickFromBank }
