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

    const currentPlayerName = playerName;

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
        (player) => player.name === currentPlayerName,
      );

      setIsHost(me?.isHost ?? false);

      const drawingEntry = Object.entries(room.drawings)
        .find(([name]) => name === currentPlayerName);
      const playerDrawing: string = drawingEntry?.[1] ?? '';

      setDrawing(playerDrawing);

      const receivedRating: number | undefined =
        Object.entries(room.ratings)
          .find(([name]) => name === currentPlayerName)?.[1];

      if (typeof receivedRating === 'number') {
        setRating(receivedRating);
      }

      if (room.phase === 'leaderboard') {
        void navigate('/leaderboard', {
          state: {
            roomCode,
            playerName: currentPlayerName,
          },
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
      setError(
        data.message || 'Unable to continue.',
      );
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
          <div className="flex w-full flex-col items-center text-center">
            <h1 className="text-3xl font-extrabold text-white">
              Rating Results
            </h1>

            <p className="mt-2 text-sm font-semibold text-white/70">
              Your drawing received:
            </p>

            <div className="mt-6 flex min-h-[300px] w-full items-center justify-center overflow-hidden rounded-xl bg-white p-4">
              {drawing ? (
                <img
                  src={drawing}
                  alt="Your drawing"
                  className="max-h-[500px] max-w-full object-contain"
                />
              ) : (
                <p className="text-sm font-semibold text-gray-500">
                  Drawing unavailable.
                </p>
              )}
            </div>

            <p className="mt-5 text-sm font-bold text-white/60">
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

            <div className="mt-6 flex w-full max-w-sm flex-col items-center">
              {isHost ? (
                <Button
                  variant="start"
                  size="full"
                  onClick={() => void handleContinue()}
                >
                  Continue to Leaderboard
                </Button>
              ) : (
                <p className="w-full text-center text-sm font-semibold text-[var(--text-muted)]">
                  Waiting for the host to continue...
                </p>
              )}
            </div>

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
