import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, RoundHeader, CountdownTimer } from '../components/ui';
import { submitPrompt, getRoom, PhaseConflictStatus } from '../api/room';
import { usePhaseAdvance } from '../hooks/usePhaseAdvance';
import type { DrawLocationState, Room } from '../types/room';

const MaxChars = 120;
const TotalTime = 60;

export default function InputPage() {
  const location = useLocation();
  const state = location.state as DrawLocationState | null;
  const navigate = useNavigate();
  const roomCode = state?.roomCode;
  const playerName = state?.playerName;

  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [room, setRoomData] = useState<Room | null>(null);
  const [aiMode, setAiMode] = useState(false);

  useEffect(() => {
    if (!roomCode || !playerName) void navigate('/');
  }, [roomCode, playerName, navigate]);

  // Check if room is in AI Mode and if so, wait for AI prompt
  useEffect(() => {
    if (!roomCode) return;

    async function checkRoom() {
      const data = await getRoom(roomCode as string, playerName);
      if (!data.success || !data.room) return;
      setRoomData(data.room);

      if (data.room.aiMode) {
        setAiMode(true);
        // AI prompt already submitted by server — navigate to draw
        if (data.room.phase === 'draw') {
          void navigate('/draw', { state: { roomCode, playerName } });
        }
      }
    }

    void checkRoom();

    // Poll until AI prompt is ready and phase advances to draw
    const interval = setInterval(() => {
      void checkRoom();
    }, 1000);

    return () => clearInterval(interval);
  }, [roomCode, playerName, navigate]);

  const { waitingFor, secondsLeft } = usePhaseAdvance({
    roomCode,
    playerName,
    enabled: submitted || aiMode,
    whenPhase: 'draw',
    to: '/draw',
    countBucket: 'prompts',
  });

  async function handleSubmit() {
    if (!input.trim() || submitted || !roomCode || !playerName) return;

    setSubmitted(true);
    setError('');

    const data = await submitPrompt(roomCode, playerName, input.trim());
    if (!data.success) {
      if (data.status === PhaseConflictStatus) return;
      setError(data.message || 'Failed to submit prompt.');
      setSubmitted(false);
      return;
    }

    if (data.room?.phase === 'draw') {
      void navigate('/draw', { state: { roomCode, playerName } });
    }
  }

  function handleExpire() {
    if (!submitted) void handleSubmit();
  }

  // AI Mode — show waiting screen while AI generates the prompt
  if (aiMode) {
    return (
      <div className="background">
        <Card variant="glass">
          <RoundHeader round={room?.round ?? 1} totalRounds={room?.maxRounds ?? 4} />
          <h1 className="text-3xl">AI Mode</h1>
          <div className="flex flex-col items-center gap-4 mt-4">
            <span className="text-5xl animate-bounce">🤖</span>
            <p className="text-[var(--text-muted)] text-sm text-center">
              The AI is generating your drawing prompt...
            </p>
            {room?.aiPrompt && (
              <div className="bg-[var(--surface-soft)] border border-[var(--surface-border)] rounded-xl p-4 text-center">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">
                  Your prompt is
                </p>
                <p className="text-xl font-extrabold text-[var(--text-primary)]">
                  &quot;{room.aiPrompt}&quot;
                </p>
              </div>
            )}
            <p className="text-xs text-[var(--text-muted)]">
              {waitingFor > 0 ? 'Heading to drawing phase...' : 'Get ready to draw!'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Classic Mode — normal prompt input
  return (
    <div className="background">
      <Card variant="glass">
        <RoundHeader round={room?.round ?? 1} totalRounds={room?.maxRounds ?? 4} />

        <h1 className="text-3xl">Write a sentence</h1>

        <input
          type="text"
          className="text box"
          maxLength={MaxChars}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={submitted}
          placeholder="Start typing your prompt here..."
        />

        <div className="flex items-center justify-between mt-3">
          <CountdownTimer
            seconds={TotalTime}
            secondsLeft={secondsLeft}
            paused={submitted}
            onExpire={handleExpire}
          />

          <Button
            variant="submit"
            size="sm"
            onClick={() => void handleSubmit()}
            disabled={submitted}
          >
            Submit
          </Button>
        </div>

        {submitted && !error && (
          <p className="text-sm text-[var(--text-muted)] mt-3">
            {waitingFor > 0
              ? `Waiting for ${waitingFor} other player${waitingFor === 1 ? '' : 's'}...`
              : 'Starting drawing phase...'}
          </p>
        )}

        {error && <p className="text-sm text-[var(--action)] mt-3">{error}</p>}
      </Card>
    </div>
  );
}