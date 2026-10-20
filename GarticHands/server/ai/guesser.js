const { GoogleGenerativeAI } = require('@google/generative-ai')
const sharp = require('sharp')

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const MAX_IMAGE_BYTES = 6 * 1024 * 1024
const MAX_SVG_BYTES = 256 * 1024
const MAX_IMAGE_PIXELS = 4 * 1024 * 1024
const IMAGE_FORMATS = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

async function decodeDrawing(dataUrl) {
  if (typeof dataUrl !== 'string' || dataUrl.length > 4 * Math.ceil(MAX_IMAGE_BYTES / 3) + 64) {
    throw new Error('Invalid or oversized image data URL')
  }
  const match = /^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl)
  if (!match || match[0].length !== dataUrl.length || !Object.hasOwn(IMAGE_FORMATS, match[1])) {
    throw new Error('Unsupported or malformed image data URL')
  }
  const [, mimeType, data] = match
  const bytes = Buffer.from(data, 'base64')
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES || bytes.toString('base64') !== data) {
    throw new Error('Invalid image base64')
  }
  // libvips can decode pixels from PNGs missing their mandatory IEND trailer.
  if (mimeType === 'image/png' && bytes.subarray(-12).toString('hex') !== '0000000049454e44ae426082') {
    throw new Error('Incomplete PNG image')
  }

  if (mimeType === 'image/svg+xml') {
    // Accept self-contained UTF-8 SVG only: no entities, resource references,
    // CSS escapes/imports or processing instructions that could load files/URLs.
    const svg = bytes.toString('utf8')
    if (
      bytes.length > MAX_SVG_BYTES ||
      !Buffer.from(svg, 'utf8').equals(bytes) ||
      /[\0&\\@]|<!|<\?|href|url\s*\(/i.test(svg)
    ) {
      throw new Error('SVG must be bounded and self-contained')
    }
  }

  const image = sharp(bytes, {
    failOn: 'warning',
    limitInputPixels: MAX_IMAGE_PIXELS,
  }).timeout({ seconds: 3 })
  const metadata = await image.metadata()
  if (
    metadata.format !== IMAGE_FORMATS[mimeType] ||
    !metadata.width ||
    !metadata.height ||
    metadata.width * metadata.height > MAX_IMAGE_PIXELS ||
    (metadata.pages || 1) > 1
  ) {
    throw new Error('Invalid image format or dimensions')
  }
  if (mimeType === 'image/svg+xml') {
    const png = await image
      .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer()
    return { mimeType: 'image/png', data: png.toString('base64') }
  }

  // Metadata alone accepts truncated files; decode the pixels before any API call.
  await image.raw().toBuffer()
  return { mimeType, data }
}

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
  if (dataUrl === undefined || dataUrl === null || dataUrl === '') {
    return 'a blank canvas'
  }

  const inlineData = await decodeDrawing(dataUrl)
  const model = client.getGenerativeModel({ model: 'gemini-3.1-flash-lite' })

  const result = await model.generateContent([
    {
      inlineData,
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