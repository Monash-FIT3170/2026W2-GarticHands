import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, RoundHeader, CountdownTimer } from '../components/ui';
import { getRoom, submitGuess, PhaseConflictStatus } from '../api/room';
import { usePhaseAdvance } from '../hooks/usePhaseAdvance';
import type { Player, DrawLocationState } from '../types/room';

const MaxChars = 120;
/** Shown until the room's server-owned deadline arrives. Real limit: `PHASE_DURATIONS` in `server/index.js`. */
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
  // Name of the player whose drawing we're guessing. Submitted alongside the
  // guess so the reveal can pair it with the right drawing even if the roster
  // changes before then.
  const [targetName, setTargetName] = useState<string | undefined>(undefined);
  const drawnBy = targetName ?? '...';
  // The draw phase can time out with nothing submitted, so "no drawing" is a
  // real outcome — distinguish it from "still fetching".
  const [drawingLoaded, setDrawingLoaded] = useState(false);

  useEffect(() => {
    if (!roomCode || !playerName) {
      void navigate('/');
      return;
    }

    // Pick the player whose drawing we'll guess: the next player in the player list,
    // wrapping around. Deterministic across clients because the list order is shared.
    void getRoom(roomCode).then((data) => {
      if (!data.success || !data.room) return;
      const players: Player[] = data.room.players;
      const myIndex = players.findIndex((p) => p.name === playerName);
      if (myIndex === -1) return;
      const target = players[(myIndex + 1) % players.length];
      setTargetName(target.name);
      setDrawing((data.room.drawings && data.room.drawings[target.name]) || '');
      setDrawingLoaded(true);
    });
  }, [roomCode, playerName, navigate]);

  const { waitingFor, room, secondsLeft } = usePhaseAdvance({
    roomCode,
    playerName,
    enabled: submitted,
    whenPhase: 'reveal',
    to: '/game',
    countBucket: 'guesses',
  });

  /** `allowEmpty` is only set by the deadline handler — the button requires text. */
  async function handleSubmit(allowEmpty = false) {
    const trimmed = guess.trim();
    if ((!trimmed && !allowEmpty) || submitted || !roomCode || !playerName) return;

    setSubmitted(true);
    setError('');

    const data = await submitGuess(roomCode, playerName, trimmed, targetName);
    if (!data.success) {
      // Raced the phase deadline: the server already moved everyone on and
      // recorded a blank guess. Stay submitted and let the phase poll navigate.
      if (data.status === PhaseConflictStatus) return;
      setError(data.message || 'Failed to submit guess.');
      setSubmitted(false);
      return;
    }

    if (data.room?.phase === 'reveal') {
      void navigate('/game', { state: { roomCode, playerName } });
    }
  }

  /** Time is up — submit whatever is typed, blank included, so the round advances. */
  function handleExpire() {
    if (!submitted) void handleSubmit(true);
  }

  return (
    <div className="background">
      <Card variant="glass">
        <RoundHeader round={room?.round ?? 1} totalRounds={room?.maxRounds ?? 4} />
        <h1 className="text-3xl">Guess this Drawing</h1>
        <p className="text-sm text-black/45 mb-5">Drawn by {drawnBy}</p>
        {drawing ? (
          <img
            src={drawing}
            alt={`Drawing by ${drawnBy}`}
            className="w-full h-48 object-contain bg-white/[0.14] rounded-lg mb-5"
          />
        ) : (
          <div className="w-full h-48 bg-white/[0.14] rounded-lg mb-5 flex items-center justify-center text-sm text-black/50">
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
          <p className="text-sm text-black/60 mt-3">
            {waitingFor > 0
              ? `Waiting for ${waitingFor} other player${waitingFor === 1 ? '' : 's'}...`
              : 'Revealing results...'}
          </p>
        )}
        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
      </Card>
    </div>
  );
}
