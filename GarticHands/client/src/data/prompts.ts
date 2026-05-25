/**
 * Drawing prompt vocabulary used by the "Computer Mode" / solo practice flow.
 * 100 concrete, easy-to-draw nouns spanning everyday objects, animals, food,
 * and simple icons. Skewed toward items with recognisable silhouettes.
 */
export const PROMPT_WORDS: readonly string[] = [
  // Animals
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

  // Food & drink
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

  // Household
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

  // Nature & weather
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

  // Transport
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

  // Body & faces
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

  // Sports & toys
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

  // Symbols & buildings
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
] as const

/** Pick a uniformly random prompt. */
export function randomPrompt(): string {
  const i = Math.floor(Math.random() * PROMPT_WORDS.length)
  return PROMPT_WORDS[i]
}

/** Pick N distinct random prompts. Caps at the list length. */
export function randomPrompts(count: number): string[] {
  const n = Math.min(count, PROMPT_WORDS.length)
  const pool = [...PROMPT_WORDS]
  const picked: string[] = []
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    picked.push(pool[idx])
    pool.splice(idx, 1)
  }
  return picked
}
