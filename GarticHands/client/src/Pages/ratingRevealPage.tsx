import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  RoundHeader,
} from '../components/ui';
import {
  getRoom,
  advanceRatingReveal,
} from '../api/room';
import type { DrawLocationState } from '../types/room';
import BackgroundRays from '../components/ui/BackgroundRays';

export default function RatingRevealPage() {
  const location = useLocation();
  const state = location.state as DrawLocationState | null;
  const navigate = useNavigate();

  const roomCode = state?.roomCode;
  const playerName = state?.playerName;

  const [drawing, setDrawing] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [round, setRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(4);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roomCode || !playerName) {
      void navigate('/');
      return;
    }

    let cancelled = false;

    async function loadRoom() {
      const data = await getRoom(roomCode);

      if (cancelled || !data.success || !data.room) {
        return;
      }

      const room = data.room;

      setRound(room.round ?? 1);
      setMaxRounds(room.maxRounds ?? 4);

      const me = room.players.find(
        (player) => player.name === playerName,
      );

      setIsHost(me?.isHost ?? false);

      // Show the current player's drawing and the score it received.
      setDrawing(room.drawings?.[playerName] || '');

      const receivedRating = room.ratings?.[playerName];

      if (typeof receivedRating === 'number') {
        setRating(receivedRating);
      }

      // Once the host moves the room to the leaderboard,
      // automatically move non-host players too.
      if (room.phase === 'leaderboard') {
        void navigate('/leaderboard', {
          state: { roomCode, playerName },
        });
      }
    }

    void loadRoom();

    const interval = window.setInterval(() => {
      void loadRoom();
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [roomCode, playerName, navigate]);

  async function handleContinue() {
    if (!roomCode || !isHost) return;

    const data = await advanceRatingReveal(roomCode);

    if (!data.success) {
      setError(data.message || 'Unable to continue.');
      return;
    }

    if (data.room?.phase === 'leaderboard') {
      void navigate('/leaderboard', {
        state: { roomCode, playerName },
      });
    }
  }

  return (
    <div className="background !justify-start">
      <BackgroundRays />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-4 py-6">
        <div className="mb-4">
          <RoundHeader
            round={round}
            totalRounds={maxRounds}
          />
        </div>

        <Card
          variant="lobby"
          className="!max-w-3xl !rounded-[22px] !p-6 md:!p-8"
        >
          <div className="flex flex-col items-center">
            <h1 className="text-center text-3xl font-extrabold text-white">
              Rating Results
            </h1>

            <p className="mt-2 text-center text-sm font-semibold text-white/70">
              Your drawing received:
            </p>

            <div className="mt-6 flex min-h-[300px] w-full items-center justify-center overflow-hidden rounded-xl bg-white p-4">
              {drawing ? (
                <img
                  src={drawing}
                  alt={`Your drawing`}
                  className="max-h-[500px] max-w-full object-contain"
                />
              ) : (
                <p className="text-sm font-semibold text-gray-500">
                  Drawing unavailable.
                </p>
              )}
            </div>

            <p className="mt-5 text-center text-sm font-bold text-white/60">
              Your drawing
            </p>

            <div className="mt-3 rounded-2xl bg-white px-8 py-4 text-center">
              <p className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Score
              </p>

              <p className="mt-1 text-5xl font-extrabold text-[var(--action)]">
                {rating !== null ? rating : '—'}
              </p>

              <p className="text-sm font-semibold text-gray-400">
                / 100
              </p>
            </div>

            {isHost ? (
              <Button
                variant="start"
                size="full"
                onClick={() => void handleContinue()}
                className="mt-6 max-w-sm"
              >
                Continue to Leaderboard
              </Button>
            ) : (
              <p className="mt-6 text-center text-sm font-semibold text-[var(--text-muted)]">
                Waiting for the host to continue...
              </p>
            )}

            {error && (
              <p className="mt-4 text-center text-sm text-[var(--action)]">
                {error}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}