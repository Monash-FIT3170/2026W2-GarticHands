import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getRoom, updateReady, startRoom } from '../api/room';
import { Page, Card, Button } from '../components/ui';
import PlayerList from '../components/PlayerList';
import { useLeaveRoom } from '../hooks/useLeaveRoom';
import { usePlayerDepartures } from '../hooks/usePlayerDepartures';
import type { GameMode, Player, DrawLocationState } from '../types/room';

const MAX_PLAYERS_DISPLAY = 8;
const MAX_PLAYERS = 8;

export default function JoinedPage() {
  const { roomCode } = useParams();
  const location = useLocation();
  const state = location.state as DrawLocationState | null;
  const playerName = state?.playerName;
  const navigate = useNavigate();

  const [players, setPlayers] = useState<Player[]>(
    state?.room?.players ?? [],
  );

  const [gameMode, setGameMode] = useState<GameMode>(
    state?.room?.mode ?? 'classic',
  );

  const [ready, setReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const [popup, setPopup] = useState('');

  const me = players.find((p) => p.name === playerName);
  const isHost = me?.isHost ?? false;

  const readyCount = players.filter(
    (p) => p.ready || p.isHost,
  ).length;

  const allReady =
    players.length > 0 &&
    players.every((p) => p.ready || p.isHost);

  const copyCode = useCallback(() => {
    if (!roomCode) return;

    navigator.clipboard.writeText(roomCode).catch(() => {});
    setPopup('Room code copied');
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode) return;

    let alreadyStarted = false;

    async function loadRoom() {
      const data = await getRoom(roomCode, playerName);

      if (!data.success || !data.room) return;

      setGameMode(data.room.mode ?? 'classic');

      const stillIn = data.room.players.some(
        (p: Player) => p.name === playerName,
      );

      if (!stillIn && !alreadyStarted) {
        void navigate('/');
        return;
      }

      setPlayers(data.room.players);

      if (data.room.status === 'started' && !alreadyStarted) {
        alreadyStarted = true;

        const midRoundJoiner = data.room.players.find(
          (p: Player) => p.name === playerName,
        )?.joinedMidRound;

        if (midRoundJoiner) {
          void navigate('/game', {
            state: {
              roomCode,
              playerName,
              joinedLate: true,
            },
          });
          return;
        }

        setStarting(true);

        setTimeout(() => {
          void navigate('/input', {
            state: { roomCode, playerName },
          });
        }, 500);

        return;
      }

      if (alreadyStarted) return;

      const meFresh = data.room.players.find(
        (p: Player) => p.name === playerName,
      );

      if (meFresh) {
        setReady(meFresh.ready);
      }
    }

    void loadRoom();

    const interval = setInterval(() => {
      void loadRoom();
    }, 1000);

    return () => clearInterval(interval);
  }, [roomCode, playerName, navigate]);

  usePlayerDepartures(players, (names) =>
    setPopup(`${names.join(', ')} left the room`),
  );

  const leaveRoom = useLeaveRoom(roomCode, playerName);

  async function handleLeave() {
    await leaveRoom();
    void navigate('/');
  }

  async function handleReady() {
    if (!roomCode || !playerName) return;

    const next = !ready;
    const data = await updateReady(
      roomCode,
      playerName,
      next,
    );

    if (data.success && data.room) {
      setReady(next);
      setPlayers(data.room.players);
    }
  }

  async function handleStart() {
    if (!roomCode || !allReady || starting) return;

    if (gameMode === 'classic' && players.length < 3) {
      setPopup(
        'Classic Mode needs at least 3 players. Switch to Leaderboard Mode to play with 2 players.',
      );
      return;
    }

    if (gameMode === 'leaderboard' && players.length < 2) {
      setPopup(
        'Leaderboard Mode needs at least 2 players.',
      );
      return;
    }

    setStarting(true);

    const data = await startRoom(roomCode);

    if (!data.success) {
      setStarting(false);
      setPopup(
        data.message ?? 'Unable to start the game.',
      );
    }
  }

  const isLeaderboard = gameMode === 'leaderboard';

  return (
    <Page variant="centered" logo>
      <Card variant="lobby">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.4fr_1fr]">
          <section className="color-vision-lobby-section rounded-xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold tracking-wide text-white">
                PLAYERS {players.length}/{MAX_PLAYERS}
              </h2>

              <p className="text-sm font-semibold text-white/80">
                {readyCount}/{players.length} ready
              </p>
            </div>

            <PlayerList
              players={players}
              selfName={playerName}
              variant="lobby"
              padTo={MAX_PLAYERS_DISPLAY}
            />
          </section>

          <section className="flex flex-col items-center">
            <div className="color-vision-lobby-section flex w-full flex-col items-center rounded-xl p-6">
              <h2 className="mb-5 text-2xl font-extrabold tracking-wide text-white">
                GAMEMODE
              </h2>

              <div className="flex w-full max-w-[200px] flex-col items-center justify-center rounded-lg border-4 border-[var(--accent)] bg-[var(--surface)] shadow-sm">
                <img
                  src={
                    isLeaderboard
                      ? '/leaderboard.png'
                      : '/gamemode_classic.png'
                  }
                  alt={
                    isLeaderboard
                      ? 'Leaderboard'
                      : 'Classic'
                  }
                  className="mb-2 h-16 w-16 object-contain"
                />

                <p className="font-extrabold text-[var(--primary)]">
                  {isLeaderboard
                    ? 'Leaderboard'
                    : 'Classic'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex w-full flex-col items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
                Room Code
              </p>

              <p className="font-mono text-4xl font-extrabold tracking-[0.3em] text-white">
                {roomCode}
              </p>

              <Button
                variant="outline"
                size="full"
                onClick={copyCode}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                    />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v5" />
                  </svg>
                  Copy Room Code
                </span>
              </Button>
            </div>

            {isHost ? (
              <Button
                variant="start"
                size="full"
                onClick={() => void handleStart()}
                disabled={!allReady || starting}
                className="mt-4"
              >
                {allReady
                  ? 'Start Game'
                  : 'Waiting for Players'}
              </Button>
            ) : (
              <Button
                variant="ready"
                active={ready}
                size="full"
                onClick={() => void handleReady()}
                disabled={starting}
                className="mt-4"
              >
                {ready ? 'Ready' : 'Ready Up'}
              </Button>
            )}

            <Button
              variant="leave"
              size="full"
              onClick={() => void handleLeave()}
              disabled={starting}
              className="mt-3"
            >
              Leave Room
            </Button>
          </section>
        </div>
      </Card>

      {popup && (
        <Popup
          message={popup}
          onClose={() => setPopup('')}
        />
      )}
    </Page>
  );
}

function Popup({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl border-2 border-[var(--accent)] bg-[var(--surface)] p-6 text-center shadow-2xl">
        <h2 className="text-xl font-extrabold text-[var(--primary)]">
          Notice
        </h2>

        <p className="mt-3 text-sm font-semibold text-[var(--text-muted)]">
          {message}
        </p>

        <Button
          variant="start"
          size="full"
          onClick={onClose}
          className="mt-6"
        >
          OK
        </Button>
      </div>
    </div>
  );
}