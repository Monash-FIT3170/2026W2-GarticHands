import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DrawingProvider,
  DrawingStage,
  DrawingModePicker,
  useDrawing,
  useDrawingMode,
} from '../drawing';
import { Card, Button } from '../components/ui';

/**
 * Free-form sandbox — load MediaPipe, see your hand tracking, draw anything you
 * want, switch layouts. No timer, no networking, no submission. Useful for
 * testing the camera setup and experimenting with gestures before joining a game.
 */
export default function PlaygroundPage() {
  return (
    <DrawingProvider>
      <PlaygroundInner />
    </DrawingProvider>
  );
}

function PlaygroundInner() {
  const navigate = useNavigate();
  const { getDrawingImage } = useDrawing();
  const [mode, setMode] = useDrawingMode();
  const [snapshot, setSnapshot] = useState<string | null>(null);

  function handleSnapshot() {
    setSnapshot(getDrawingImage());
  }

  return (
    <div className="background !justify-start">
      <Card variant="glass" className="w-full !max-w-5xl">
        <div className="flex items-start justify-between mb-3 gap-4">
          <div>
            <p className="rounds">Playground</p>
            <h1 className="text-3xl">MediaPipe Sandbox</h1>
            <p className="text-sm text-white/80 mt-1">
              No timer, no network — try every layout and gesture.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void navigate('/')}>
            Home
          </Button>
        </div>

        <DrawingModePicker mode={mode} onModeChange={setMode} />
        <DrawingStage mode={mode} />

        <p className="text-xs text-white/70 mt-4 text-center">
          Pinch your index finger and thumb to draw &middot; Open palm to erase
        </p>

        <div className="flex items-end justify-end mt-4 gap-3">
          <Button variant="outline" size="sm" onClick={handleSnapshot}>
            Snapshot
          </Button>
        </div>

        {snapshot && (
          <div className="mt-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/80 mb-2">
              Last Snapshot
            </p>
            <img
              src={snapshot}
              alt="Snapshot of your drawing"
              className="w-full max-w-md bg-white rounded-lg border border-white/30"
            />
          </div>
        )}
      </Card>
    </div>
  );
}
