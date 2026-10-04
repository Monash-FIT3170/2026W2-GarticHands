/**
 * The LLM seam (FORKING.md § Seam 8). Every AI feature calls
 * `chat(messages, modelProfile)` and never a vendor API directly, so a fork can
 * switch providers with environment variables alone.
 *
 * Configuration (all optional):
 *   AI_ENABLED          'false' turns every AI call off (use in CI / tests).
 *   LLM_PROVIDER        groq (default) | ollama | custom
 *   GROQ_API_KEY        required for the groq provider; without it AI is off.
 *   LLM_BASE_URL        overrides the provider's base URL (required for custom).
 *   LLM_API_KEY         key for the custom provider (optional, e.g. for OpenRouter).
 *   LLM_MODEL_FAST      overrides the model used for the 'fast' profile.
 *   LLM_MODEL_SMART     overrides the model used for the 'smart' profile.
 *   LLM_MODEL_VISION    overrides the model used for the 'vision' profile.
 *   LLM_TIMEOUT_MS      per-request timeout, default 8000.
 */

const { complete } = require('./providers/openaiCompatible')

/**
 * Profiles describe what a caller needs, not which model it gets:
 *   fast   — small, cheap, low latency (prompt generation)
 *   smart  — stronger reasoning / structured output (AI drawing strokes)
 *   vision — accepts image input (AI guesser)
 * Defaults follow the GarticHands AI Opponent Guide; every one is overridable.
 */
const PROVIDERS = {
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    keyEnv: 'GROQ_API_KEY',
    keyRequired: true,
    models: {
      fast: 'llama-3.1-8b-instant',
      smart: 'llama-3.3-70b-versatile',
      vision: 'meta-llama/llama-4-scout-17b-16e-instruct',
    },
  },
  // Local and free. Run `ollama pull llama3.2` first. No key needed.
  ollama: {
    baseUrl: 'http://localhost:11434/v1',
    keyEnv: null,
    keyRequired: false,
    models: { fast: 'llama3.2', smart: 'llama3.2', vision: 'llava' },
  },
  // Any other OpenAI-compatible endpoint (OpenRouter, OpenAI, LM Studio...).
  // Needs LLM_BASE_URL and LLM_MODEL_<PROFILE>; there are no defaults to go stale.
  custom: {
    baseUrl: null,
    keyEnv: 'LLM_API_KEY',
    keyRequired: false,
    models: {},
  },
}

const DEFAULT_TIMEOUT_MS = 8000

function providerName() {
  return (process.env.LLM_PROVIDER || 'groq').toLowerCase()
}

/** Resolve the provider preset plus env overrides, or null if it can't be used. */
function resolveConfig(profile) {
  const preset = PROVIDERS[providerName()]
  if (!preset) return null

  const baseUrl = process.env.LLM_BASE_URL || preset.baseUrl
  const apiKey = preset.keyEnv ? process.env[preset.keyEnv] : undefined
  const model = process.env[`LLM_MODEL_${profile.toUpperCase()}`] || preset.models[profile]

  if (!baseUrl || !model) return null
  if (preset.keyRequired && !apiKey) return null
  return { baseUrl, apiKey, model }
}

/**
 * Whether an AI call for `profile` can be attempted at all. False means callers
 * should go straight to their static fallback without touching the network.
 */
function isAiEnabled(profile = 'fast') {
  if (process.env.AI_ENABLED === 'false') return false
  return resolveConfig(profile) !== null
}

/**
 * Send `messages` to the configured provider and return the reply text.
 * Throws when AI is disabled or the request fails; callers must catch.
 */
async function chat(messages, profile = 'fast', { json = true, temperature = 0.4, timeoutMs } = {}) {
  if (process.env.AI_ENABLED === 'false') throw new Error('AI is disabled (AI_ENABLED=false)')

  const config = resolveConfig(profile)
  if (!config) throw new Error(`AI provider '${providerName()}' is not configured`)

  const envTimeout = Number(process.env.LLM_TIMEOUT_MS)
  return complete({
    ...config,
    messages,
    json,
    temperature,
    timeoutMs: timeoutMs || (envTimeout > 0 ? envTimeout : DEFAULT_TIMEOUT_MS),
  })
}

/**
 * Parse a model reply as JSON. Tolerates the common failure modes of models
 * without a strict JSON mode: code fences and prose around the object.
 */
function parseJsonReply(text) {
  try {
    return JSON.parse(text)
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end <= start) throw new Error('LLM reply was not JSON')
    return JSON.parse(text.slice(start, end + 1))
  }
}

module.exports = { chat, isAiEnabled, parseJsonReply, PROVIDERS }
