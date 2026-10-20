const { GoogleGenerativeAI } = require('@google/generative-ai')

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

async function generatePrompt() {
  const model = client.getGenerativeModel({ model: 'gemini-3.1-flash-lite' })

  const result = await model.generateContent(
    'Generate a single creative and drawable prompt for a Pictionary-style drawing game. ' +
    'It should be fun, visual, and possible to draw in 60 seconds. ' +
    'Examples: "a penguin on a skateboard", "a haunted teapot", "a robot walking a dog". ' +
    'Reply with only the prompt itself, nothing else. No quotes, no punctuation at the end.',
  )

  const response = await result.response
  return response.text().trim()
}

async function generateGuess(dataUrl) {
  if (!dataUrl) {
    return 'a blank canvas'
  }

  const image = typeof dataUrl === 'string'
    ? /^data:(image\/(?:png|jpeg|webp));base64,((?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?)$/.exec(dataUrl)
    : null
  if (!image || !image[2]) {
    throw new Error('Drawing must be a base64 PNG, JPEG or WebP data URL')
  }
  const [, mimeType, base64Data] = image

  const model = client.getGenerativeModel({ model: 'gemini-3.1-flash-lite' })

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    },
    'This is a hand-drawn sketch from a Pictionary-style drawing game. ' +
    'The player drew it using hand tracking gestures so lines may be rough or incomplete. ' +
    'Even if the drawing is unclear, make your best guess at what it could be. ' +
    'Reply with only 1-4 words describing what you think it is. ' +
    'Never say you cannot tell or that it is unclear — always guess something.',
  ])

  const response = await result.response
  const text = response.text().trim()
  console.log(`[AI] Raw response: "${text}"`)
  return text
}

module.exports = { generatePrompt, generateGuess }