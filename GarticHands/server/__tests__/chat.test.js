/**
 * Unit tests for the LLM adapter. `fetch` is stubbed, so no request leaves the
 * machine and no API key is needed.
 */
const { describe, it, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert/strict')

const { chat, isAiEnabled, parseJsonReply } = require('../ai/chat')

const ENV_KEYS = [
  'AI_ENABLED',
  'LLM_PROVIDER',
  'GROQ_API_KEY',
  'LLM_BASE_URL',
  'LLM_API_KEY',
  'LLM_MODEL_FAST',
  'LLM_TIMEOUT_MS',
]

let savedEnv
let savedFetch
let requests

function stubFetch(response) {
  requests = []
  globalThis.fetch = async (url, init) => {
    requests.push({ url, init, body: JSON.parse(init.body) })
    return response
  }
}

function okResponse(content) {
  return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }] }) }
}

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]))
  for (const k of ENV_KEYS) delete process.env[k]
  savedFetch = globalThis.fetch
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k]
    else process.env[k] = savedEnv[k]
  }
  globalThis.fetch = savedFetch
})

describe('isAiEnabled', () => {
  it('is off for groq without an API key', () => {
    assert.equal(isAiEnabled('fast'), false)
  })

  it('is on for groq with an API key', () => {
    process.env.GROQ_API_KEY = 'test-key'
    assert.equal(isAiEnabled('fast'), true)
  })

  it('is off whenever AI_ENABLED=false', () => {
    process.env.GROQ_API_KEY = 'test-key'
    process.env.AI_ENABLED = 'false'
    assert.equal(isAiEnabled('fast'), false)
  })

  it('is on for ollama with no key', () => {
    process.env.LLM_PROVIDER = 'ollama'
    assert.equal(isAiEnabled('fast'), true)
  })

  it('is off for custom until a base URL and model are set', () => {
    process.env.LLM_PROVIDER = 'custom'
    assert.equal(isAiEnabled('fast'), false)
    process.env.LLM_BASE_URL = 'https://example.test/v1'
    process.env.LLM_MODEL_FAST = 'some-model'
    assert.equal(isAiEnabled('fast'), true)
  })

  it('is off for an unknown provider', () => {
    process.env.LLM_PROVIDER = 'nope'
    process.env.GROQ_API_KEY = 'test-key'
    assert.equal(isAiEnabled('fast'), false)
  })
})

describe('chat', () => {
  it('posts an OpenAI-style request to Groq with the fast model and JSON mode', async () => {
    process.env.GROQ_API_KEY = 'test-key'
    stubFetch(okResponse('{"prompts":["cat"]}'))

    const reply = await chat([{ role: 'user', content: 'hi' }], 'fast')

    assert.equal(reply, '{"prompts":["cat"]}')
    assert.equal(requests[0].url, 'https://api.groq.com/openai/v1/chat/completions')
    assert.equal(requests[0].init.headers.Authorization, 'Bearer test-key')
    assert.equal(requests[0].body.model, 'llama-3.1-8b-instant')
    assert.deepEqual(requests[0].body.response_format, { type: 'json_object' })
  })

  it('honours model and base URL overrides', async () => {
    process.env.LLM_PROVIDER = 'custom'
    process.env.LLM_BASE_URL = 'https://example.test/v1/'
    process.env.LLM_MODEL_FAST = 'my-model'
    stubFetch(okResponse('ok'))

    await chat([], 'fast', { json: false })

    assert.equal(requests[0].url, 'https://example.test/v1/chat/completions')
    assert.equal(requests[0].body.model, 'my-model')
    assert.equal(requests[0].body.response_format, undefined)
    assert.equal(requests[0].init.headers.Authorization, undefined)
  })

  it('throws with the HTTP status on a failed request', async () => {
    process.env.GROQ_API_KEY = 'test-key'
    stubFetch({ ok: false, status: 429, json: async () => ({}) })

    await assert.rejects(chat([], 'fast'), (err) => err.status === 429)
  })

  it('throws when the reply has no content', async () => {
    process.env.GROQ_API_KEY = 'test-key'
    stubFetch({ ok: true, status: 200, json: async () => ({ choices: [] }) })

    await assert.rejects(chat([], 'fast'), /no message content/)
  })

  it('throws without calling fetch when AI is disabled', async () => {
    process.env.GROQ_API_KEY = 'test-key'
    process.env.AI_ENABLED = 'false'
    stubFetch(okResponse('x'))

    await assert.rejects(chat([], 'fast'), /disabled/)
    assert.equal(requests.length, 0)
  })
})

describe('parseJsonReply', () => {
  it('parses plain JSON', () => {
    assert.deepEqual(parseJsonReply('{"a":1}'), { a: 1 })
  })

  it('extracts JSON from surrounding prose and fences', () => {
    assert.deepEqual(parseJsonReply('Here:\n```json\n{"a":1}\n```'), { a: 1 })
  })

  it('throws when there is no JSON object', () => {
    assert.throws(() => parseJsonReply('nothing here'))
  })
})
