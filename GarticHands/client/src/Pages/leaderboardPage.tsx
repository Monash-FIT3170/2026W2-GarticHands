import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, RoundHeader } from '../components/ui';
import { getRoom, restartRoom, endRoom } from '../api/room';
import type { DrawLocationState, Player } from '../types/room';
import BackgroundRays from '../components/ui/BackgroundRays';

export default function LeaderboardPage() {
  const location = useLocation();
  const state = location.state as DrawLocationState | null;
  const navigate = useNavigate();

  const roomCode = state?.roomCode;
  const playerName = state?.playerName;

  const [players, setPlayers] = useState<Player[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
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
      const data = await getRoom(roomCode, playerName);

      if (cancelled || !data.success || !data.room) {
        return;
      }

      const room = data.room;

      setPlayers(room.players);
      setScores(room.scores ?? {});
      setRound(room.round ?? 1);
      setMaxRounds(room.maxRounds ?? 4);

      const me = room.players.find((player) => player.name === playerName);

      setIsHost(me?.isHost ?? false);

      if (room.phase !== 'leaderboard') {
        if (room.phase === 'prompt') {
          void navigate('/input', {
            state: { roomCode, playerName },
          });
        }
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

  async function handleNextRound() {
    if (!roomCode || !isHost) return;

    if (round >= maxRounds) {
      return;
    }

    const data = await restartRoom(roomCode);

    if (!data.success) {
      setError(data.message || 'Unable to start the next round.');
      return;
    }

    void navigate('/input', {
      state: { roomCode, playerName },
    });
  }

  async function handleEndGame() {
    if (!roomCode || !isHost) return;

    const data = await endRoom(roomCode);

    if (!data.success) {
      setError(data.message || 'Unable to end the game.');
      return;
    }

    void navigate('/');
  }

  const sortedPlayers = [...players].sort((a, b) => (scores[b.name] ?? 0) - (scores[a.name] ?? 0));

  const isFinalRound = round >= maxRounds;

  return (
    <div className="background !justify-start">
      <BackgroundRays />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center px-4 py-6">
        <div className="mb-4">
          <RoundHeader round={round} totalRounds={maxRounds} />
        </div>

        <Card variant="lobby" className="!max-w-3xl !rounded-[22px] !p-6 md:!p-8">
          <div className="flex flex-col items-center">
            <h1 className="text-center text-3xl font-extrabold text-white">Leaderboard</h1>

            <p className="mt-2 text-center text-sm font-semibold text-white/70">
              {isFinalRound ? 'Final scores' : `Scores after Round ${round}`}
            </p>

            <div className="mt-6 w-full max-w-2xl overflow-hidden rounded-xl bg-white">
              {sortedPlayers.map((player, index) => {
                const score = scores[player.name] ?? 0;
                const isCurrentPlayer = player.name === playerName;

                return (
                  <div
                    key={player.name}
                    className={`flex items-center justify-between border-b border-gray-200 px-5 py-4 last:border-b-0 ${
                      isCurrentPlayer ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-8 text-center text-lg font-extrabold text-gray-400">
                        {index + 1}
                      </span>

                      <div>
                        <p className="font-extrabold text-gray-800">
                          {player.name}
                          {isCurrentPlayer && ' (You)'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-[var(--action)]">{score}</p>

                      <p className="text-xs font-semibold text-gray-400">points</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {isHost && (
              <div className="mt-6 flex w-full max-w-sm translate-x-0 flex-col gap-3 md:translate-x-6">
                {!isFinalRound && (
                  <Button variant="start" size="full" onClick={() => void handleNextRound()}>
                    Start Round {round + 1}
                  </Button>
                )}

                <Button variant="leave" size="full" onClick={() => void handleEndGame()}>
                  End Game
                </Button>
              </div>
            )}

            {!isHost && (
              <p className="mt-6 text-center text-sm font-semibold text-[var(--text-muted)]">
                {isFinalRound
                  ? 'Waiting for the host to end the game...'
                  : 'Waiting for the host to start the next round...'}
              </p>
            )}

            {error && <p className="mt-4 text-center text-sm text-[var(--action)]">{error}</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
