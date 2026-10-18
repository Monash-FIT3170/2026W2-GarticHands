import { useState, type FormEvent } from 'react';
import { aiDraw } from '../api/room';
import { Button } from './ui';

/**
 * Type any prompt and watch a bot sketch it — the same drawer bots use in a
 * game (`POST /ai/draw`). Handy for seeing what bots will draw before
 * playing against them, and for checking the LLM is hooked up: the caption
 * says whether the AI or the offline template bank produced the drawing.
 */
export default function AiSketch() {
  const [prompt, setPrompt] = useState('');
  const [drawing, setDrawing] = useState<{ src: string; prompt: string; source: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || busy) return;

    setBusy(true);
    setError('');
    try {
      const data = await aiDraw(trimmed);
      if (data.success && data.dataUrl) {
        setDrawing({
          src: data.dataUrl,
          prompt: data.prompt ?? trimmed,
          source: data.source ?? '',
        });
      } else {
        setError(data.message ?? 'The bot could not draw that.');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="ai-sketch-title" className="mt-6">
      <h2
        id="ai-sketch-title"
        className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2"
      >
        Watch a bot draw
      </h2>

      <form onSubmit={(e) => void handleSubmit(e)} className="flex gap-2">
        <label htmlFor="ai-sketch-prompt" className="sr-only">
          Prompt for the bot to draw
        </label>
        <input
          id="ai-sketch-prompt"
          type="text"
          value={prompt}
          maxLength={120}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. a cat wearing a crown"
          className="flex-1 min-w-0 rounded-lg bg-white px-4 py-2 text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <Button type="submit" variant="outline" size="sm" disabled={busy || !prompt.trim()}>
          {busy ? 'Drawing…' : 'Draw it'}
        </Button>
      </form>

      {error && <p className="mt-2 text-sm text-[var(--action)]">{error}</p>}

      {drawing && (
        <figure className="mt-3">
          {/* `key` remounts the image so the stroke animation replays for each new drawing. */}
          <img
            key={drawing.src}
            src={drawing.src}
            alt={`A bot's drawing of ${drawing.prompt}`}
            className="w-full max-w-md aspect-[4/3] bg-white rounded-lg border border-[var(--surface-border)]"
          />
          <figcaption className="mt-1 text-xs text-[var(--text-muted)]">
            “{drawing.prompt}” — drawn by{' '}
            {drawing.source === 'ai' ? 'the AI' : 'the offline sketch bank (no AI key set)'}
          </figcaption>
        </figure>
      )}
    </section>
  );
}
