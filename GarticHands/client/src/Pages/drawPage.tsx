import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DrawingProvider,
  DrawingStage,
  DrawingModePicker,
  useDrawing,
  useDrawingMode,
  useRecorder,
} from '../drawing';
import { Card, Button, RoundHeader, CountdownTimer } from '../components/ui';
import { getRoom, submitDrawing } from '../api/room';
import { usePhaseAdvance } from '../hooks/usePhaseAdvance';
import { useRecordings } from '../state/RecordingsContext';
import type { DrawLocationState } from '../types/room';

const TotalTime = 60;

export default function DrawPage() {
  return (
    <DrawingProvider>
      <DrawPageInner />
    </DrawingProvider>
  );
}

/** Inner component so `useDrawing()` finds the surrounding `<DrawingProvider>`. */
function DrawPageInner() {
  const location = useLocation();
  const state = location.state as DrawLocationState | null;
  const navigate = useNavigate();
  const roomCode = state?.roomCode;
  const playerName = state?.playerName;

  const { getDrawingImage } = useDrawing();
  const recorder = useRecorder();
  const { saveRecording } = useRecordings();
  const [mode, setMode] = useDrawingMode();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState<string>('');
  const [roundNum, setRoundNum] = useState<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!roomCode || !playerName) {
      void navigate('/');
      return;
    }

    void getRoom(roomCode).then((data) => {
      if (data.success && data.room) {
        if (data.room.prompts) setPrompt(data.room.prompts[playerName] || '');
        setRoundNum(data.room.round ?? 1);
      }
    });
  }, [roomCode, playerName, navigate]);

  // Start recording once we know the round. `startedRef` guards StrictMode
  // double-mount. `recorder` is intentionally NOT in the deps — its method refs
  // are stable across renders (memoized in useRecorder), but the object that
  // ALSO carries `isRecording`/`lastBlobUrl` state would re-run this effect on
  // every 1s phase-advance poll and cancel the scheduled start timer before it
  // fires. That was the bug behind the missing recordings.
  useEffect(() => {
    if (startedRef.current) return;
    if (roundNum === null) return;
    if (!recorder.isSupported) return;
    startedRef.current = true;
    // Slight delay so the camera canvas has mounted and started drawing frames.
    const t = setTimeout(() => void recorder.start(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundNum]);

  const { waitingFor, room } = usePhaseAdvance({
    roomCode,
    playerName,
    enabled: submitted,
    whenPhase: 'guess',
    to: '/guess',
    countBucket: 'drawings',
  });

  async function handleSubmit() {
    if (submitted || !roomCode || !playerName) return;

    const dataUrl = getDrawingImage();
    if (!dataUrl) {
      setError('Canvas is not ready yet.');
      return;
    }

    setSubmitted(true);
    setError('');

    // Stop recording in parallel with the submit. `stop()` resolves with `null`
    // if nothing was being recorded, so no isRecording-state check is needed —
    // that check was racy (state lags by a render) and silently dropped saves.
    const [data, blobUrl] = await Promise.all([
      submitDrawing(roomCode, playerName, dataUrl),
      recorder.stop(),
    ]);

    if (blobUrl && roundNum !== null) {
      saveRecording({
        round: roundNum,
        blobUrl,
        prompt: prompt || undefined,
        createdAt: Date.now(),
      });
    }

    if (!data.success) {
      setError(data.message || 'Failed to submit drawing.');
      setSubmitted(false);
      return;
    }

    if (data.room?.phase === 'guess') {
      void navigate('/guess', { state: { roomCode, playerName } });
    }
  }

  function handleExpire() {
    if (!submitted) void handleSubmit();
  }

  return (
    <div className="background !justify-start">
      <Card variant="glass" className="w-full !max-w-5xl">
        <div className="flex items-start justify-between mb-3 gap-4">
          <div>
            <RoundHeader round={room?.round ?? 1} totalRounds={room?.maxRounds ?? 4} />
            <h1 className="text-3xl">Draw with your hands</h1>
            {prompt && (
              <p className="text-sm text-white/80 mt-1">
                Your prompt: <span className="font-semibold">{prompt}</span>
              </p>
            )}
          </div>
          <CountdownTimer seconds={TotalTime} paused={submitted} onExpire={handleExpire} />
        </div>

        <DrawingModePicker mode={mode} onModeChange={setMode} disabled={submitted} />
        <DrawingStage mode={mode} />

        <p className="text-xs text-white/70 mt-4 text-center">
          Pinch your index finger and thumb to draw &middot; Open palm to erase
        </p>

        <div className="flex flex-col items-end mt-4 gap-2">
          <Button
            variant="submit"
            size="sm"
            onClick={() => void handleSubmit()}
            disabled={submitted}
          >
            Submit Drawing
          </Button>
          {submitted && !error && (
            <p className="text-sm text-white/80">
              {waitingFor > 0
                ? `Waiting for ${waitingFor} other player${waitingFor === 1 ? '' : 's'}...`
                : 'Starting guessing phase...'}
            </p>
          )}
          {error && <p className="text-sm text-red-300">{error}</p>}
        </div>
      </Card>
    </div>
  );
}
