import { createRequire } from 'node:module';
import sharp from 'sharp';
import { afterEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { generateGuess } = require('../../server/ai/guesser') as {
  generateGuess: (dataUrl: unknown) => Promise<string>;
};
const { drawPrompt } = require('../../server/ai/drawer') as {
  drawPrompt: (prompt: string, options: { animate: boolean }) => Promise<{ dataUrl: string }>;
};

interface ImageRequest {
  contents: { parts: { inlineData: { mimeType: string; data: string } }[] }[];
}

// A valid PNG smaller than the old 1000-character blank-canvas cutoff.
const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('AI drawing image decoding', () => {
  it.each(['image/png', 'image/jpeg', 'image/webp'])(
    'sends only base64 bytes with the original %s MIME type',
    async (mimeType) => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: ' a small drawing ' }] } }],
          }),
        ),
      );
      vi.stubGlobal('fetch', fetchMock);

      expect(await generateGuess(`data:${mimeType};base64,${PNG}`)).toBe('a small drawing');
      expect(fetchMock).toHaveBeenCalledOnce();
      const request = JSON.parse(fetchMock.mock.calls[0][1].body as string) as ImageRequest;
      expect(request.contents[0].parts[0]).toEqual({
        inlineData: { mimeType, data: PNG },
      });
    },
  );

  it.each([
    123,
    {},
    'not an image',
    `data:text/plain;base64,${PNG}`,
    `data:image/png,${PNG}`,
    'data:image/png;base64,',
    'data:image/png;base64,not base64!',
    'data:image/png;base64,AAA',
    'data:image/png;base64,AAAA====',
  ])('rejects malformed or unsupported input %j before calling the model', async (input) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(generateGuess(input)).rejects.toThrow('base64 PNG, JPEG, WebP or SVG');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('converts an AI-generated SVG to a visible PNG before sending it to Gemini', async () => {
    vi.stubEnv('AI_ENABLED', 'false');
    const { dataUrl } = await drawPrompt('a cat', { animate: false });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'a cat' }] } }],
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    expect(await generateGuess(dataUrl)).toBe('a cat');
    const request = JSON.parse(fetchMock.mock.calls[0][1].body as string) as ImageRequest;
    const { inlineData } = request.contents[0].parts[0];
    expect(inlineData.mimeType).toBe('image/png');
    const png = sharp(Buffer.from(inlineData.data, 'base64'));
    expect(await png.metadata()).toMatchObject({ format: 'png', width: 640, height: 480 });
    const { channels } = await png.stats();
    expect(channels[0].min).toBeLessThan(255);
    expect(channels[0].max).toBe(255);
  });

  it('does not call Gemini when SVG rasterization fails', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(generateGuess(`data:image/svg+xml;base64,${PNG}`)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps the blank-canvas fallback for a missing drawing', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect(await generateGuess('')).toBe('a blank canvas');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
