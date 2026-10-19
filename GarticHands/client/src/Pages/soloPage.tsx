import { useState } from 'react';
import {
  DrawingProvider,
  DrawingStage,
  DrawingModePicker,
  useDrawing,
  useDrawingMode,
} from '../drawing';
import { Card, Button } from '../components/ui';
import BackgroundRays from '../components/ui/BackgroundRays';
import { usePromptQueue } from '../hooks/usePromptQueue';

interface SavedDrawing {
  prompt: string;
  image: string;
}

/**
 * Single-player practice mode. The computer hands you a prompt (fresh ones from
 * the server's AI prompt generator, falling back to `data/prompts.ts`); you draw
 * it; save a snapshot or skip to a new word. Prompts don't repeat within a
 * session. No timer-forced submit.
 */
export default function SoloPage() {
  return (
    <DrawingProvider>
      <SoloInner />
    </DrawingProvider>
  );
}

function SoloInner() {
  const { getDrawingImage, clearDrawing } = useDrawing();
  const [mode, setMode] = useDrawingMode();
  const { prompt, next: nextPrompt } = usePromptQueue();
  const [results, setResults] = useState<SavedDrawing[]>([]);
  const [drawingKey, setDrawingKey] = useState(0);

  function handleSave() {
    const image = getDrawingImage();
    if (!image) return;
    setResults((r) => [{ prompt, image }, ...r]);
  }

  function handleNext() {
    clearDrawing();
    nextPrompt();
    setDrawingKey((k) => k + 1);
  }

  function handleSaveAndNext() {
    handleSave();
    handleNext();
  }

  return (
    <div className="background !justify-start">
      <BackgroundRays />

      <Card variant="lobby" className="relative z-10 !max-w-6xl !rounded-[22px] !p-4 md:!p-6">
        <div className="mb-3 flex flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-center">
          <div className="flex justify-center lg:justify-start">
            <p className="rounds !mb-0">SOLO</p>
          </div>

          <DrawingModePicker
            mode={mode}
            onModeChange={setMode}
            className="!m-0 flex justify-center"
          />

          <div className="flex justify-center lg:justify-end">
            <div className="flex items-center gap-1 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[var(--action)]">
              <span>Time left:</span>

              <span className="text-base leading-none">∞</span>
            </div>
          </div>
        </div>

        <DrawingStage
          key={drawingKey}
          mode={mode}
          presentation="game"
          prompt={prompt}
          toolbarActions={
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                className="whitespace-nowrap !rounded-lg !px-3 !py-2 text-sm"
              >
                Skip Prompt
              </Button>

              <Button
                variant="submit"
                size="sm"
                onClick={handleSaveAndNext}
                className="whitespace-nowrap !rounded-lg !border-2 !border-[var(--success)] !bg-white !px-3 !py-2 text-sm !text-[var(--success)] hover:!bg-white/90"
              >
                Save + New Prompt
              </Button>
            </div>
          }
        />

        <p className="text-xs text-[var(--text-muted)] mt-4 text-center">
          The computer picked this prompt. Draw it, save it, then get a new one.
        </p>

        {results.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2">
              Your Drawings ({results.length})
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {results.map((r, i) => (
                <div
                  key={i}
                  className="bg-[var(--surface-soft)] border border-[var(--surface-border)] rounded-lg p-2"
                >
                  <img
                    src={r.image}
                    alt={r.prompt}
                    className="w-full aspect-[4/3] object-contain bg-[var(--surface)] rounded"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1 text-center italic">
                    {r.prompt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
