import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, RoundHeader, CountdownTimer } from '../components/ui';
import { submitPrompt, PhaseConflictStatus } from '../api/room';
import { usePhaseAdvance } from '../hooks/usePhaseAdvance';
import type { DrawLocationState } from '../types/room';

const MaxChars = 120;
/** Shown until the room's server-owned deadline arrives. Real limit: `PHASE_DURATIONS` in `server/index.js`. */
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

  useEffect(() => {
    if (!roomCode || !playerName) void navigate('/');
  }, [roomCode, playerName, navigate]);

  const { waitingFor, room, secondsLeft } = usePhaseAdvance({
    roomCode,
    playerName,
    enabled: submitted,
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
      // Raced the phase deadline: the server already moved everyone on and gave
      // us a fallback prompt. Stay submitted and let the phase poll navigate.
      if (data.status === PhaseConflictStatus) return;
      setError(data.message || 'Failed to submit prompt.');
      setSubmitted(false);
      return;
    }

    if (data.room?.phase === 'draw') {
      void navigate('/draw', { state: { roomCode, playerName } });
    }
  }

  /**
   * Time is up. Send whatever has been typed; an empty box is left to the
   * server, which assigns a fallback prompt when it force-advances.
   */
  function handleExpire() {
    if (!submitted) void handleSubmit();
  }

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
          <p className="text-sm text-black/60 mt-3">
            {waitingFor > 0
              ? `Waiting for ${waitingFor} other player${waitingFor === 1 ? '' : 's'}...`
              : 'Starting drawing phase...'}
          </p>
        )}
        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
      </Card>
    </div>
  );
}
