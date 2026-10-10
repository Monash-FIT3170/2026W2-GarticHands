const { GoogleGenerativeAI } = require('@google/generative-ai')

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

/**
 * Generates a creative drawing prompt for the player.
 * Called at the start of the prompt phase in AI Mode —
 * the player skips typing and gets a prompt automatically.
 *
 * @returns {Promise<string>} - A short, drawable prompt e.g. "a penguin on a skateboard"
 */
async function generatePrompt() {
  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const result = await model.generateContent(
    'Generate a single creative and drawable prompt for a Pictionary-style drawing game. ' +
    'It should be fun, visual, and possible to draw in 60 seconds. ' +
    'Examples: "a penguin on a skateboard", "a haunted teapot", "a robot walking a dog". ' +
    'Reply with only the prompt itself, nothing else. No quotes, no punctuation at the end.',
  )

  const response = await result.response
  return response.text().trim()
}

/**
 * Sends a drawing (as a base64 PNG data URL) to Gemini's vision API
 * and returns a short guess of what the drawing depicts.
 *
 * @param {string} dataUrl - The PNG data URL of the drawing
 * @returns {Promise<string>} - A 1-4 word guess
 */
async function generateGuess(dataUrl) {
  // Strip the data:image/png;base64, prefix
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')

  const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'image/png',
        data: base64Data,
      },
    },
    'This is a hand-drawn sketch from a Pictionary-style drawing game. ' +
    'The player drew it using hand tracking gestures so lines may be rough. ' +
    'In 1-4 words only, what do you think this drawing is of? ' +
    'Reply with only your guess, nothing else. No punctuation, no explanation.',
  ])

  const response = await result.response
  return response.text().trim()
}

module.exports = { generatePrompt, generateGuess }