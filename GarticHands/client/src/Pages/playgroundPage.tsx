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
import AiSketch from '../components/AiSketch';

/**
 * Free-form sandbox — load MediaPipe, see your hand tracking, draw anything you
 * want, switch layouts. No timer and no submission. Useful for testing the
 * camera setup and experimenting with gestures before joining a game. The
 * "Watch a bot draw" box is the only part that talks to the server.
 */
export default function PlaygroundPage() {
  return (
    <DrawingProvider>
      <PlaygroundInner />
    </DrawingProvider>
  );
}

function PlaygroundInner() {
  const { getDrawingImage } = useDrawing();
  const [mode, setMode] = useDrawingMode();
  const [snapshot, setSnapshot] = useState<string | null>(null);

  function handleSnapshot() {
    setSnapshot(getDrawingImage());
  }

  return (
    <div className="background !justify-start">
      <BackgroundRays />

      <Card variant="lobby" className="relative z-10 !max-w-6xl !rounded-[22px] !p-4 md:!p-6">
        <div className="mb-3 flex flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-center">
          <div className="flex justify-center lg:justify-start">
            <p className="rounds !mb-0">Playground</p>
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
          mode={mode}
          presentation="game"
          heading="Draw Something!"
          toolbarActions={
            <Button
              variant="submit"
              size="sm"
              onClick={handleSnapshot}
              className="whitespace-nowrap !rounded-lg !border-2 !border-[var(--success)] !bg-white !px-3 !py-2 text-sm !text-[var(--success)] hover:!bg-white/90"
            >
              Snapshot
            </Button>
          }
        />

        <p className="text-xs text-[var(--text-muted)] mt-4 text-center">
          Pinch your index finger and thumb to draw &middot; Open palm to erase
        </p>

        {snapshot && (
          <div className="mt-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2">
              Last Snapshot
            </p>
            <img
              src={snapshot}
              alt="Snapshot of your drawing"
              className="w-full max-w-md bg-[var(--surface)] rounded-lg border border-[var(--surface-border)]"
            />
          </div>
        )}

        <AiSketch />
      </Card>
    </div>
  );
}
