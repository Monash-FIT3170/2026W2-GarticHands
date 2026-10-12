/**
 * Unit tests for the AI drawer. `fetch` is stubbed, so no request leaves the
 * machine and no API key is needed.
 */
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const {
  drawPrompt,
  sanitiseShapes,
  renderSvg,
  templateShapes,
  matchTemplates,
} = require('../ai/drawer');

const ENV_KEYS = ['AI_ENABLED', 'LLM_PROVIDER', 'GROQ_API_KEY', 'LLM_MODEL_SMART'];

let savedEnv;
let savedFetch;
let requests;

function stubLlmReply(content) {
  requests = [];
  globalThis.fetch = async (url, init) => {
    requests.push({ url, body: JSON.parse(init.body) });
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }] }) };
  };
}

function enableAi() {
  process.env.GROQ_API_KEY = 'test-key';
}

function decodeSvg(dataUrl) {
  return Buffer.from(dataUrl.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf8');
}

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const k of ENV_KEYS) delete process.env[k];
  savedFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('unexpected network call');
  };
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  globalThis.fetch = savedFetch;
});

describe('sanitiseShapes', () => {
  it('keeps valid shapes and drops unknown or broken ones', () => {
    const shapes = sanitiseShapes({
      shapes: [
        { type: 'circle', x: 50, y: 40, r: 10 },
        { type: 'triangle', points: [] },
        { type: 'line', x1: 'a', y1: 0, x2: 1, y2: 1 },
        { type: 'polyline', points: [[1, 1]] },
        { type: 'rect', x: 10, y: 10, w: 20, h: 5 },
      ],
    });
    assert.deepEqual(
      shapes.map((s) => s.type),
      ['circle', 'rect'],
    );
  });

  it('clamps coordinates that wander off the canvas', () => {
    const [line] = sanitiseShapes({
      shapes: [{ type: 'line', x1: -500, y1: 10, x2: 9000, y2: 900 }],
    });
    assert.equal(line.x1, -5);
    assert.equal(line.x2, 105);
    assert.equal(line.y2, 80);
  });

  it('normalises rectangles with negative size', () => {
    const [rect] = sanitiseShapes({ shapes: [{ type: 'rect', x: 50, y: 50, w: -20, h: -10 }] });
    assert.deepEqual(rect, { type: 'rect', x: 30, y: 40, w: 20, h: 10 });
  });

  it('caps the number of shapes', () => {
    const many = Array.from({ length: 100 }, (_, i) => ({ type: 'circle', x: i, y: 10, r: 2 }));
    assert.equal(sanitiseShapes({ shapes: many }).length, 24);
  });

  it('throws when nothing usable is left', () => {
    assert.throws(() => sanitiseShapes({ shapes: [{ type: 'blob' }] }));
    assert.throws(() => sanitiseShapes({ nope: true }));
  });
});

describe('renderSvg', () => {
  const shapes = [
    { type: 'circle', x: 50, y: 37, r: 10 },
    { type: 'line', x1: 10, y1: 10, x2: 90, y2: 60 },
  ];

  it('draws one stroke per shape in the game canvas style', () => {
    const svg = renderSvg(shapes, { animate: false });
    assert.match(svg, /viewBox="0 0 640 480"/);
    assert.match(svg, /stroke:#000;stroke-width:4;stroke-linecap:round/);
    assert.equal((svg.match(/<path /g) || []).length, 2);
    assert.doesNotMatch(svg, /@keyframes/);
  });

  it('animates strokes one after another', () => {
    const svg = renderSvg(shapes, { animate: true });
    const delays = [...svg.matchAll(/animation-delay:([\d.]+)s/g)].map((m) => Number(m[1]));
    assert.equal(delays.length, 2);
    assert.ok(delays[1] > delays[0]);
    assert.match(svg, /prefers-reduced-motion/);
  });

  it('is deterministic for the same seed', () => {
    assert.equal(renderSvg(shapes, { seed: 'cat' }), renderSvg(shapes, { seed: 'cat' }));
  });
});

describe('template fallback', () => {
  it('matches nouns and simple plurals', () => {
    assert.deepEqual(matchTemplates('A cat wearing a crown'), ['cat', 'crown']);
    assert.deepEqual(matchTemplates('two dogs'), ['dog']);
    assert.deepEqual(matchTemplates('that thing'), []);
  });

  it('seats an accessory on top of its subject', () => {
    const shapes = templateShapes('a dog wearing a hat');
    const hatBrim = shapes.find((s) => s.type === 'line' && s.y1 === s.y2 && s.x2 - s.x1 > 15);
    const dogHead = shapes.find((s) => s.type === 'circle' && s.r > 10);
    assert.ok(hatBrim, 'hat brim is drawn');
    assert.ok(hatBrim.y1 < dogHead.y, 'hat sits above the head centre');
    assert.ok(hatBrim.y1 > dogHead.y - dogHead.r - 5, 'hat touches the head');
  });

  it('still draws something for prompts it does not know', () => {
    assert.ok(templateShapes('quantum entanglement').length > 0);
  });
});

describe('drawPrompt', () => {
  it('uses templates without touching the network when AI is off', async () => {
    process.env.AI_ENABLED = 'false';
    const drawing = await drawPrompt('a rocket');
    assert.equal(drawing.source, 'template');
    assert.match(drawing.dataUrl, /^data:image\/svg\+xml;base64,/);
    assert.match(decodeSvg(drawing.dataUrl), /<svg /);
  });

  it('draws the shapes the model returns', async () => {
    enableAi();
    stubLlmReply(
      JSON.stringify({
        shapes: [
          { type: 'circle', x: 50, y: 37, r: 20 },
          { type: 'line', x1: 30, y1: 30, x2: 70, y2: 30 },
          { type: 'arc', x: 50, y: 40, r: 8, start: 20, end: 160 },
        ],
      }),
    );

    const drawing = await drawPrompt('a smiley face');

    assert.equal(drawing.source, 'ai');
    assert.equal(drawing.shapes.length, 3);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].body.response_format.type, 'json_object');
    assert.match(requests[0].body.messages[0].content, /NEVER write text/);
    assert.match(requests[0].body.messages[1].content, /a smiley face/);
  });

  it('accepts JSON wrapped in prose or code fences', async () => {
    enableAi();
    stubLlmReply('Sure!\n```json\n{"shapes":[{"type":"circle","x":50,"y":37,"r":20}]}\n```');
    const drawing = await drawPrompt('a ball');
    assert.equal(drawing.source, 'ai');
  });

  it('falls back to templates when the model reply is unusable', async () => {
    enableAi();
    stubLlmReply('{"shapes":[{"type":"spiral"}]}');
    const drawing = await drawPrompt('a cat');
    assert.equal(drawing.source, 'template');
    assert.ok(drawing.shapes.length > 3);
  });

  it('falls back to templates when the request fails', async () => {
    enableAi();
    globalThis.fetch = async () => ({ ok: false, status: 429, text: async () => 'rate limited' });
    const drawing = await drawPrompt('a house');
    assert.equal(drawing.source, 'template');
  });
});
