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
import type { DrawingTool } from '../drawing/components/Canvas';
import { Card, Button, RoundHeader, CountdownTimer } from '../components/ui';
import { getRoom, submitDrawing, PhaseConflictStatus } from '../api/room';
import { usePhaseAdvance } from '../hooks/usePhaseAdvance';
import { useRecordings } from '../state/RecordingsContext';
import type { DrawLocationState, GameMode } from '../types/room';
import BackgroundRays from '../components/ui/BackgroundRays';

/** Shown until the room's server-owned deadline arrives. Real limit: `PHASE_DURATIONS` in `server/index.js`. */
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
  const [mode, setMode] = useDrawingMode('overlay');
  const [tool, setTool] = useState<DrawingTool>('draw');
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState<string>('');
  const [roundNum, setRoundNum] = useState<number | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const startedRef = useRef(false);

  useEffect(() => {
    if (!roomCode || !playerName) {
      void navigate('/');
      return;
    }

    void getRoom(roomCode).then((data) => {
      if (data.success && data.room) {
        const promptAuthor = data.room.promptTargets?.[playerName];

        if (promptAuthor && data.room.prompts) {
          setPrompt(data.room.prompts[promptAuthor] || '');
        } else {
          setPrompt('');
        }

        setRoundNum(data.room.round ?? 1);
        setGameMode(data.room.mode ?? 'classic');
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

    const t = setTimeout(() => void recorder.start(), 400);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundNum]);

  const nextPhase = gameMode === 'leaderboard' ? 'rating' : 'guess';
  const nextPage = gameMode === 'leaderboard' ? '/rating' : '/guess';

  const { waitingFor, room, secondsLeft } = usePhaseAdvance({
    roomCode,
    playerName,
    enabled: submitted,
    whenPhase: nextPhase,
    to: nextPage,
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
      if (data.status === PhaseConflictStatus) return;

      setError(data.message || 'Failed to submit drawing.');
      setSubmitted(false);
      return;
    }

    if (data.room?.phase === 'guess') {
      void navigate('/guess', {
        state: { roomCode, playerName },
      });
    }

    if (data.room?.phase === 'rating') {
      void navigate('/rating', {
        state: { roomCode, playerName },
      });
    }
  }

  /** Time is up — submit the canvas as it stands rather than losing the drawing. */
  function handleExpire() {
    if (!submitted) void handleSubmit();
  }

  const actionLabel =
    tool === 'draw'
      ? drawingEnabled
        ? 'Stop Drawing'
        : 'Start Drawing'
      : drawingEnabled
        ? 'Stop Erasing'
        : 'Start Erasing';

  return (
    <div className="background !justify-start">
      <BackgroundRays />

      <Card variant="lobby" className="relative z-10 !max-w-5xl !rounded-[22px] !p-4 md:!p-6">
        <div className="mb-3 flex flex-col items-stretch justify-between gap-3 md:flex-row md:items-center">
          <div className="flex justify-center md:justify-start">
            <RoundHeader round={room?.round ?? 1} totalRounds={room?.maxRounds ?? 4} />
          </div>

          <DrawingModePicker
            mode={mode}
            onModeChange={setMode}
            disabled={submitted}
            className="!m-0 flex justify-center"
          />

          <div className="flex justify-center md:justify-end">
            <div className="flex items-center gap-1 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[var(--action)]">
              <span>Time left:</span>

              <CountdownTimer
                seconds={TotalTime}
                secondsLeft={secondsLeft}
                paused={submitted}
                onExpire={handleExpire}
                suffix="s"
                className="!text-[var(--action)]"
              />
            </div>
          </div>
        </div>

        <DrawingStage
          mode={mode}
          drawingEnabled={drawingEnabled}
          tool={tool}
          onToolChange={setTool}
          presentation="game"
          prompt={prompt}
          toolbarActions={
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                onClick={() => setDrawingEnabled((enabled) => !enabled)}
                disabled={submitted}
                className={`whitespace-nowrap !rounded-lg !px-3 !py-2 text-sm font-bold text-white transition-colors ${
                  drawingEnabled
                    ? 'bg-[var(--action)] hover:bg-[var(--action-strong)]'
                    : 'bg-[var(--success)] hover:bg-[var(--success-hover)]'
                } ${submitted ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {actionLabel}
              </Button>

              <Button
                variant="submit"
                size="sm"
                onClick={() => void handleSubmit()}
                disabled={submitted}
                className="!rounded-lg !border-2 !border-[var(--success)] !bg-white !px-3 !py-2 text-sm !text-[var(--success)] hover:!bg-white/90"
              >
                Submit Drawing
              </Button>
            </div>
          }
        />

        {submitted && !error && (
          <p className="mt-3 text-center text-sm text-[var(--text-muted)]">
            {waitingFor > 0
              ? `Waiting for ${waitingFor} other player${waitingFor === 1 ? '' : 's'}...`
              : gameMode === 'leaderboard'
                ? 'Starting rating phase...'
                : 'Starting guessing phase...'}
          </p>
        )}

        {error && <p className="mt-3 text-center text-sm text-[var(--action)]">{error}</p>}
      </Card>
    </div>
  );
}
