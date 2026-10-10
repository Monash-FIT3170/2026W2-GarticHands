import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, RoundHeader, CountdownTimer } from '../components/ui';
import { getRoom, submitGuess, PhaseConflictStatus } from '../api/room';
import { usePhaseAdvance } from '../hooks/usePhaseAdvance';
import type { Player, Room, DrawLocationState } from '../types/room';

const MaxChars = 120;
const TotalTime = 60;

export default function GuessingPage() {
  const location = useLocation();
  const state = location.state as DrawLocationState | null;
  const navigate = useNavigate();
  const roomCode = state?.roomCode;
  const playerName = state?.playerName;

  const [guess, setGuess] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [drawing, setDrawing] = useState<string>('');
  const [targetName, setTargetName] = useState<string | undefined>(undefined);
  const [drawingLoaded, setDrawingLoaded] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [room, setRoomData] = useState<Room | null>(null);

  const drawnBy = targetName ?? '...';

  useEffect(() => {
    if (!roomCode || !playerName) {
      void navigate('/');
      return;
    }

    void getRoom(roomCode).then((data) => {
      if (!data.success || !data.room) return;
      setRoomData(data.room);

      // AI Mode — skip guessing entirely, wait for AI to guess and advance
      if (data.room.aiMode) {
        setAiMode(true);
        // If AI already guessed and phase advanced, navigate immediately
        if (data.room.phase === 'reveal') {
          void navigate('/game', { state: { roomCode, playerName } });
        }
        return;
      }

      // Classic Mode — pick target player's drawing to guess
      const players: Player[] = data.room.players.filter((p) => !p.joinedMidRound);
      const myIndex = players.findIndex((p) => p.name === playerName);
      if (myIndex === -1) return;
      const target = players[(myIndex + 1) % players.length];
      setTargetName(target.name);
      setDrawing((data.room.drawings && data.room.drawings[target.name]) || '');
      setDrawingLoaded(true);
    });
  }, [roomCode, playerName, navigate]);

  // In AI Mode, poll until the AI submits its guess and phase moves to reveal
  useEffect(() => {
    if (!aiMode || !roomCode) return;

    const interval = setInterval(async () => {
      const data = await getRoom(roomCode, playerName);
      if (!data.success || !data.room) return;
      setRoomData(data.room);

      if (data.room.phase === 'reveal') {
        void navigate('/game', { state: { roomCode, playerName } });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [aiMode, roomCode, playerName, navigate]);

  const { waitingFor, secondsLeft } = usePhaseAdvance({
    roomCode,
    playerName,
    enabled: submitted,
    whenPhase: 'reveal',
    to: '/game',
    countBucket: 'guesses',
  });

  async function handleSubmit(allowEmpty = false) {
    const trimmed = guess.trim();
    if ((!trimmed && !allowEmpty) || submitted || !roomCode || !playerName) return;

    setSubmitted(true);
    setError('');

    const data = await submitGuess(roomCode, playerName, trimmed, targetName);
    if (!data.success) {
      if (data.status === PhaseConflictStatus) return;
      setError(data.message || 'Failed to submit guess.');
      setSubmitted(false);
      return;
    }

    if (data.room?.phase === 'reveal') {
      void navigate('/game', { state: { roomCode, playerName } });
    }
  }

  function handleExpire() {
    if (!submitted) void handleSubmit(true);
  }

  // AI Mode — show waiting screen while AI generates its guess
  if (aiMode) {
    return (
      <div className="background">
        <Card variant="glass">
          <RoundHeader round={room?.round ?? 1} totalRounds={room?.maxRounds ?? 4} />
          <h1 className="text-3xl">AI Mode</h1>
          <div className="flex flex-col items-center gap-4 mt-4">
            <span className="text-5xl animate-pulse">🤖</span>
            <p className="text-[var(--text-muted)] text-sm text-center">
              The AI is analysing your drawing...
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Hang tight — results coming up!
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Classic Mode — normal guessing UI
  return (
    <div className="background">
      <Card variant="glass">
        <RoundHeader round={room?.round ?? 1} totalRounds={room?.maxRounds ?? 4} />

        <h1 className="text-3xl">Guess this Drawing</h1>

        <p className="text-sm text-[var(--text-muted)] mb-5">Drawn by {drawnBy}</p>

        {drawing ? (
          <img
            src={drawing}
            alt={`Drawing by ${drawnBy}`}
            className="w-full h-48 object-contain bg-white/[0.14] rounded-lg mb-5"
          />
        ) : (
          <div className="w-full h-48 bg-white/[0.14] rounded-lg mb-5 flex items-center justify-center text-sm text-[var(--text-muted)]">
            {drawingLoaded ? `${drawnBy} ran out of time — no drawing` : 'Loading drawing...'}
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <CountdownTimer
            seconds={TotalTime}
            secondsLeft={secondsLeft}
            paused={submitted}
            onExpire={handleExpire}
            suffix=" seconds left"
          />
        </div>

        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          maxLength={MaxChars}
          placeholder="What is this drawing?"
          disabled={submitted}
        />

        <Button
          variant="submit"
          size="sm"
          onClick={() => void handleSubmit()}
          disabled={!guess.trim() || submitted}
        >
          Submit Guess
        </Button>

        {submitted && !error && (
          <p className="text-sm text-[var(--text-muted)] mt-3">
            {waitingFor > 0
              ? `Waiting for ${waitingFor} other player${waitingFor === 1 ? '' : 's'}...`
              : 'Revealing results...'}
          </p>
        )}

        {error && <p className="text-sm text-[var(--action)] mt-3">{error}</p>}
      </Card>
    </div>
  );
}