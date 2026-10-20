const { describe, it, beforeEach, afterEach, after, mock } = require('node:test');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const sdk = require('@google/generative-ai');
const { renderSvg, templateShapes } = require('../ai/drawer');

let requests;
const generateContent = mock.fn(async (input) => {
  requests.push(input);
  return { response: { text: () => '  a fish  ' } };
});
const getGenerativeModel = mock.fn(() => ({ generateContent }));
const constructor = mock.method(sdk, 'GoogleGenerativeAI', function () {
  return { getGenerativeModel };
});
const { generateGuess, generatePrompt } = require('../ai/guesser');
constructor.mock.restore();

let savedFetch;
beforeEach(() => {
  requests = [];
  getGenerativeModel.mock.resetCalls();
  savedFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('Unexpected network call');
  };
});
afterEach(() => {
  globalThis.fetch = savedFetch;
});
after(() => {
  mock.restoreAll();
});

function dataUrl(mimeType, bytes) {
  return `data:${mimeType};base64,${Buffer.from(bytes).toString('base64')}`;
}

async function raster(format) {
  return sharp({
    create: { width: 8, height: 8, channels: 3, background: '#f00' },
  })
    .toFormat(format)
    .toBuffer();
}

describe('Gemini drawing input', () => {
  for (const [mimeType, format] of [
    ['image/png', 'png'],
    ['image/jpeg', 'jpeg'],
    ['image/webp', 'webp'],
  ]) {
    it(`preserves valid small ${mimeType} bytes and MIME type`, async () => {
      const bytes = await raster(format);
      const url = dataUrl(mimeType, bytes);
      assert.ok(url.length < 1000, 'regression: small images are not blank');
      assert.equal(await generateGuess(url), 'a fish');
      assert.deepEqual(requests[0][0].inlineData, {
        mimeType,
        data: bytes.toString('base64'),
      });
      assert.equal(getGenerativeModel.mock.callCount(), 1);
    });
  }

  it('rasterizes a completed bot SVG to a PNG with visible strokes', async () => {
    const svg = renderSvg(templateShapes('a fish'), { animate: false });
    await generateGuess(dataUrl('image/svg+xml', svg));
    const { mimeType, data } = requests[0][0].inlineData;
    assert.equal(mimeType, 'image/png');
    assert.ok(!data.startsWith('data:'));
    const bytes = Buffer.from(data, 'base64');
    assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    const { data: pixels, info } = await sharp(bytes)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.ok(info.width <= 1024 && info.height <= 1024);
    assert.ok(
      pixels.some((value) => value < 128),
      'drawing must not be all white',
    );
    assert.ok(
      pixels.some((value) => value === 255),
      'white canvas is retained',
    );
  });

  for (const absent of [undefined, null, '']) {
    it(`keeps the blank fallback for ${String(absent)}`, async () => {
      assert.equal(await generateGuess(absent), 'a blank canvas');
      assert.equal(getGenerativeModel.mock.callCount(), 0);
    });
  }

  const malformed = [
    false,
    123,
    {},
    ' ',
    'not an image',
    'data:image/png;base64,',
    'data:image/png;base64,!!!!',
    'data:image/png;base64,YQ',
    'data:image/png;base64,YR==',
    'data:image/png;base64,YQ===',
    'data:image/png;base64,YQ==\n',
    'data:image/png,YQ==',
    'data:image/gif;base64,R0lGODlh',
    dataUrl('image/png', 'not PNG bytes'),
    dataUrl('image/svg+xml', '<svg>'),
    dataUrl(
      'image/svg+xml',
      '<svg xmlns="http://www.w3.org/2000/svg" width="99999" height="99999"/>',
    ),
    dataUrl('image/svg+xml', Buffer.alloc(256 * 1024 + 1, 32)),
    `data:image/png;base64,${'A'.repeat(9 * 1024 * 1024)}`,
  ];
  for (const [index, input] of malformed.entries()) {
    it(`rejects malformed, unsupported or oversized image ${index + 1} before calling Gemini`, async () => {
      await assert.rejects(generateGuess(input));
      assert.equal(getGenerativeModel.mock.callCount(), 0);
    });
  }

  for (const resource of [
    '<image href="file:///etc/passwd"/>',
    '<image href="https://example.invalid/image.png"/>',
    '<image xlink:href="data:image/svg+xml;base64,PHN2Zy8+"/>',
    '<!DOCTYPE svg [<!ENTITY file SYSTEM "file:///etc/passwd">]>',
    '<style>@import "https://example.invalid/style.css";</style>',
    '<style>path{fill:url(file:///etc/passwd)}</style>',
    '<style>path{fill:u\\72l(file:///etc/passwd)}</style>',
    '<image h&#114;ef="file:///etc/passwd"/>',
    '<?xml-stylesheet href="file:///etc/passwd"?>',
  ]) {
    it(`rejects SVG resource loading: ${resource}`, async () => {
      await assert.rejects(
        generateGuess(
          dataUrl(
            'image/svg+xml',
            `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">${resource}</svg>`,
          ),
        ),
      );
      assert.equal(getGenerativeModel.mock.callCount(), 0);
    });
  }

  it('rejects MIME mismatches before calling Gemini', async () => {
    await assert.rejects(generateGuess(dataUrl('image/png', await raster('jpeg'))));
    await assert.rejects(generateGuess(dataUrl('image/svg+xml', await raster('png'))));
    assert.equal(getGenerativeModel.mock.callCount(), 0);
  });

  it('rejects whitespace appended to otherwise valid image data', async () => {
    const url = dataUrl('image/png', await raster('png'));
    await assert.rejects(generateGuess(`${url}\n`));
    assert.equal(getGenerativeModel.mock.callCount(), 0);
  });

  for (const format of ['png', 'jpeg', 'webp']) {
    it(`rejects truncated ${format} files before calling Gemini`, async () => {
      const bytes = await raster(format);
      const mimeType = `image/${format}`;
      await assert.rejects(
        generateGuess(dataUrl(mimeType, bytes.subarray(0, Math.floor(bytes.length / 2)))),
      );
      assert.equal(getGenerativeModel.mock.callCount(), 0);
    });
  }

  it('rejects truncated PNG pixel data even when its header is readable', async () => {
    const bytes = await raster('png');
    const truncated = bytes.subarray(0, bytes.length - 20);
    assert.equal((await sharp(truncated).metadata()).format, 'png');
    await assert.rejects(generateGuess(dataUrl('image/png', truncated)));
    assert.equal(getGenerativeModel.mock.callCount(), 0);
  });

  it('rejects PNGs with truncated or missing IEND trailers', async () => {
    const bytes = await raster('png');
    for (const missingBytes of [1, 8, 12]) {
      await assert.rejects(generateGuess(dataUrl('image/png', bytes.subarray(0, -missingBytes))));
    }
    assert.equal(getGenerativeModel.mock.callCount(), 0);
  });

  it('rejects oversized raster dimensions before calling Gemini', async () => {
    const bytes = await sharp({
      create: { width: 2049, height: 2049, channels: 3, background: '#000' },
    })
      .png()
      .toBuffer();
    await assert.rejects(generateGuess(dataUrl('image/png', bytes)));
    assert.equal(getGenerativeModel.mock.callCount(), 0);
  });

  it('rejects non-UTF-8 SVG input before calling Gemini', async () => {
    await assert.rejects(generateGuess(dataUrl('image/svg+xml', Buffer.from([0xff, 0xfe, 0, 0]))));
    assert.equal(getGenerativeModel.mock.callCount(), 0);
  });

  it('keeps prompt generation and trimmed responses', async () => {
    assert.equal(await generatePrompt(), 'a fish');
    assert.equal(typeof requests[0], 'string');
  });

  it('propagates Gemini failures for the caller fallback', async () => {
    generateContent.mock.mockImplementationOnce(async () => {
      throw new Error('Gemini unavailable');
    });
    await assert.rejects(
      generateGuess(dataUrl('image/png', await raster('png'))),
      /Gemini unavailable/,
    );
  });
});
