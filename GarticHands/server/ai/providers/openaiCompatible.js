/**
 * Adapter for any OpenAI-compatible `/chat/completions` endpoint.
 *
 * Groq, Ollama, OpenRouter and OpenAI all speak this wire format, so a single
 * adapter covers every provider preset in `../chat.js`. This is the only file
 * that talks to an LLM vendor over the network: swap or add a provider here
 * and nothing else changes (FORKING.md § Seam 8).
 */

/**
 * Send one chat completion request and return the assistant's text.
 * Throws on network errors, timeouts, non-2xx responses and empty replies;
 * callers are expected to catch and degrade.
 */
async function complete({ baseUrl, apiKey, model, messages, json, timeoutMs, temperature }) {
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    signal: AbortSignal.timeout(timeoutMs),
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature,
      ...(json && { response_format: { type: 'json_object' } }),
    }),
  });

  if (!res.ok) {
    // 429 = rate limited. Surfaced on the error so callers can log it distinctly.
    // The provider's own message (e.g. "model not found") makes failures
    // diagnosable from the server log; it never contains the API key.
    let detail = '';
    try {
      detail = (await res.text()).replace(/\s+/g, ' ').slice(0, 300);
    } catch {
      // No readable body — the status code alone will have to do.
    }
    const err = new Error(
      `LLM request failed with HTTP ${res.status}${detail ? `: ${detail}` : ''}`,
    );
    err.status = res.status;
    throw err;
  }

  const body = await res.json();
  const content =
    body && body.choices && body.choices[0] && body.choices[0].message
      ? body.choices[0].message.content
      : undefined;
  if (typeof content !== 'string' || content.length === 0) {
    throw new Error('LLM response had no message content');
  }
  return content;
}

module.exports = { complete };
