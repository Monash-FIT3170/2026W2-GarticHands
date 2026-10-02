import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createRoom, getRoom, startRoom } from '../api/room';
import { Page, Card, Button, useToast } from '../components/ui';
import PlayerList from '../components/PlayerList';
import { useLeaveRoom } from '../hooks/useLeaveRoom';
import { usePlayerDepartures } from '../hooks/usePlayerDepartures';
import type { GameMode, Player, DrawLocationState } from '../types/room';

const MAX_PLAYERS_DISPLAY = 8;
const MAX_PLAYERS = 8;

export default function HostingPage() {
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const { toast, show } = useToast('pill');

  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as (DrawLocationState & {
    mode?: GameMode;
  }) | null;

  const hostName = state?.playerName;
  const gameMode = state?.mode ?? 'classic';

  useEffect(() => {
    async function setupRoom() {
      if (!hostName) {
        void navigate('/');
        return;
      }

      const data = await createRoom(hostName, gameMode);

      if (data.success && data.roomCode && data.room) {
        setRoomCode(data.roomCode);
        setPlayers(data.room.players);
      }
    }

    void setupRoom();
  }, [hostName, gameMode, navigate]);

  useEffect(() => {
    if (!roomCode || !hostName) return;

    let cancelled = false;

    async function pollRoom() {
      try {
        const data = await getRoom(roomCode);

        if (!cancelled && data.success && data.room) {
          setPlayers(data.room.players);
        }
      } catch {
        // Ignore polling errors and retry on the next interval.
      }
    }

    void pollRoom();

    const interval = window.setInterval(() => {
      void pollRoom();
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [roomCode, hostName, navigate]);

  usePlayerDepartures(players, (names) => {
    show(`${names.join(', ')} left the room`);
  });

  const leaveRoom = useLeaveRoom(roomCode || undefined, hostName);

  const readyCount = players.filter(
    (player) => player.ready || player.isHost,
  ).length;

  const allReady =
    players.length > 0 &&
    players.every((player) => player.ready || player.isHost);

  async function handleLeave() {
    await leaveRoom();
    void navigate('/');
  }

  function copyCode() {
    if (!roomCode) return;

    void navigator.clipboard.writeText(roomCode);
    show('Room code copied');
  }

  async function handleStart() {
    if (!allReady || !hostName) return;

    if (gameMode === 'classic' && players.length < 3) {
      show(
        'Classic Mode needs at least 3 players. Switch to Leaderboard to play with 2 players.',
      );
      return;
    }

    if (gameMode === 'leaderboard' && players.length < 2) {
      show('Leaderboard Mode needs at least 2 players.');
      return;
    }

    const data = await startRoom(roomCode);

    if (!data.success) {
      show(data.message ?? 'Unable to start the game');
      return;
    }

    show('Starting game...');

    setTimeout(() => {
      void navigate('/input', {
        state: {
          roomCode,
          playerName: hostName,
        },
      });
    }, 1200);
  }

  return (
    <Page className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Host Game
            </h1>
            <p className="mt-1 text-white/60">
              Share the room code with your friends.
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={() => void handleLeave()}
          >
            Leave
          </Button>
        </div>

        <div className="grid flex-1 gap-6 md:grid-cols-[1fr_1.4fr]">
          <Card className="flex flex-col items-center justify-center p-8 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-wider text-white/50">
              Room Code
            </p>

            <button
              type="button"
              onClick={copyCode}
              className="rounded-xl bg-white/10 px-8 py-5 text-5xl font-bold tracking-[0.2em] text-white transition hover:bg-white/15"
            >
              {roomCode || '------'}
            </button>

            <p className="mt-4 text-sm text-white/50">
              Click the code to copy it
            </p>

            <div className="mt-8">
              <GamemodeSelect mode={gameMode} />
            </div>
          </Card>

          <Card className="flex flex-col p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Players
                </h2>
                <p className="text-sm text-white/50">
                  {players.length}/{MAX_PLAYERS_DISPLAY} players
                </p>
              </div>

              <div className="text-sm text-white/60">
                {readyCount}/{players.length} ready
              </div>
            </div>

            <div className="flex-1">
              <PlayerList players={players} />
            </div>

            <div className="mt-6">
              <Button
                className="w-full"
                disabled={
                  !allReady ||
                  players.length > MAX_PLAYERS ||
                  !hostName
                }
                onClick={() => void handleStart()}
              >
                Start Game
              </Button>

              {!allReady && players.length > 0 && (
                <p className="mt-3 text-center text-sm text-white/50">
                  Waiting for all players to be ready...
                </p>
              )}
            </div>
          </Card>
        </div>

        {toast && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
            {toast}
          </div>
        )}
      </div>
    </Page>
  );
}

function GamemodeSelect({ mode }: { mode: GameMode }) {
  const isLeaderboard = mode === 'leaderboard';

  return (
    <div className="flex flex-col items-center">
      <p className="mb-3 text-sm font-medium uppercase tracking-wider text-white/50">
        Game Mode
      </p>

      <div className="flex items-center gap-3 rounded-xl bg-white/5 px-5 py-4">
        <img
          src={
            isLeaderboard
              ? '/leaderboard.png'
              : '/gamemode_classic.png'
          }
          alt={isLeaderboard ? 'Leaderboard' : 'Classic'}
          className="h-12 w-12 object-contain"
        />

        <p className="text-lg font-semibold text-white">
          {isLeaderboard ? 'Leaderboard' : 'Classic'}
        </p>
      </div>
    </div>
  );
}