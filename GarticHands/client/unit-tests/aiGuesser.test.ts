import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { generateGuess } = require('../../server/ai/guesser') as {
  generateGuess: (dataUrl: unknown) => Promise<string>;
};

// A valid PNG smaller than the old 1000-character blank-canvas cutoff.
const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=';

afterEach(() => {
  vi.unstubAllGlobals();
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
      const request = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(request.contents[0].parts[0]).toEqual({
        inlineData: { mimeType, data: PNG },
      });
    },
  );

  it.each([
    null,
    123,
    {},
    'not an image',
    `data:image/svg+xml;base64,${PNG}`,
    `data:text/plain;base64,${PNG}`,
    `data:image/png,${PNG}`,
    'data:image/png;base64,',
    'data:image/png;base64,not base64!',
    'data:image/png;base64,AAA',
    'data:image/png;base64,AAAA====',
  ])('rejects malformed or unsupported input %j before calling the model', async (input) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    if (input === null) {
      expect(await generateGuess(input)).toBe('a blank canvas');
    } else {
      await expect(generateGuess(input)).rejects.toThrow('base64 PNG, JPEG or WebP');
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps the blank-canvas fallback for a missing drawing', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect(await generateGuess('')).toBe('a blank canvas');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
