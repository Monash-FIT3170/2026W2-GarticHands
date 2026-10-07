import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createRoom, getRoom, startRoom } from '../api/room';
import { Page, Card, Button } from '../components/ui';
import PlayerList from '../components/PlayerList';
import { useLeaveRoom } from '../hooks/useLeaveRoom';
import { usePlayerDepartures } from '../hooks/usePlayerDepartures';
import type { GameMode, Player, DrawLocationState } from '../types/room';

const MAX_PLAYERS_DISPLAY = 8;
const MAX_PLAYERS = 8;

export default function HostingPage() {
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [popup, setPopup] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as
    | (DrawLocationState & {
        mode?: GameMode;
      })
    | null;

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
        const data = await getRoom(roomCode, hostName);

        if (!cancelled && data.success && data.room) {
          setPlayers(data.room.players);
        }
      } catch {
        // Retry on the next poll.
      }
    }

    void pollRoom();

    const interval = window.setInterval(() => {
      void pollRoom();
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [roomCode, hostName]);

  usePlayerDepartures(players, (names) => {
    setPopup(`${names.join(', ')} left the room`);
  });

  const leaveRoom = useLeaveRoom(roomCode || undefined, hostName);

  const readyCount = players.filter((player) => player.ready || player.isHost).length;

  const allReady = players.length > 0 && players.every((player) => player.ready || player.isHost);

  const copyCode = useCallback(() => {
    if (!roomCode) return;

    navigator.clipboard.writeText(roomCode).catch(() => {});
    setPopup('Room code copied');
  }, [roomCode]);

  async function handleLeave() {
    await leaveRoom();
    void navigate('/');
  }

  async function handleStart() {
    if (!allReady || !hostName) return;

    if (gameMode === 'classic' && players.length < 3) {
      setPopup(
        'Classic Mode needs at least 3 players. Switch to Leaderboard Mode to play with 2 players.',
      );
      return;
    }

    if (gameMode === 'leaderboard' && players.length < 2) {
      setPopup('Leaderboard Mode needs at least 2 players.');
      return;
    }

    const data = await startRoom(roomCode);

    if (!data.success) {
      setPopup(data.message ?? 'Unable to start the game.');
      return;
    }

    void navigate('/input', {
      state: {
        roomCode,
        playerName: hostName,
      },
    });
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
              selfName={hostName}
              variant="lobby"
              padTo={MAX_PLAYERS_DISPLAY}
            />
          </section>

          <section className="flex flex-col items-center">
            <div className="color-vision-lobby-section flex w-full flex-col items-center rounded-xl p-6">
              <h2 className="mb-5 text-2xl font-extrabold tracking-wide text-white">GAMEMODE</h2>

              <div className="flex w-full max-w-[200px] flex-col items-center justify-center rounded-lg border-4 border-[var(--accent)] bg-[var(--surface)] shadow-sm">
                {isLeaderboard ? (
                  <LeaderboardIcon />
                ) : (
                  <img
                    src="/gamemode_classic.png"
                    alt="Classic"
                    className="mb-2 h-16 w-16 object-contain"
                  />
                )}

                <p className="font-extrabold text-[var(--primary)]">
                  {isLeaderboard ? 'Leaderboard' : 'Classic'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex w-full flex-col items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
                Room Code
              </p>

              <p className="font-mono text-4xl font-extrabold tracking-[0.3em] text-white">
                {roomCode || '------'}
              </p>

              <Button variant="outline" size="full" onClick={copyCode}>
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
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v5" />
                  </svg>
                  Copy Room Code
                </span>
              </Button>
            </div>

            <Button
              variant="start"
              size="full"
              onClick={() => void handleStart()}
              disabled={!allReady || players.length > MAX_PLAYERS}
              className="mt-4"
            >
              {allReady ? 'Start Game' : 'Waiting for Players'}
            </Button>

            <Button variant="leave" size="full" onClick={() => void handleLeave()} className="mt-3">
              Leave Room
            </Button>
          </section>
        </div>
      </Card>

      {popup && <Popup message={popup} onClose={() => setPopup('')} />}
    </Page>
  );
}

function Popup({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl border-2 border-[var(--accent)] bg-[var(--surface)] p-6 text-center shadow-2xl">
        <h2 className="text-xl font-extrabold text-[var(--primary)]">Notice</h2>

        <p className="mt-3 text-sm font-semibold text-black">{message}</p>

        <Button variant="start" size="full" onClick={onClose} className="mt-6">
          OK
        </Button>
      </div>
    </div>
  );
}

function LeaderboardIcon() {
  return (
    <svg viewBox="0 0 100 100" className="h-16 w-16 mb-2" aria-hidden="true">
      <rect
        x="18"
        y="48"
        width="18"
        height="34"
        rx="4"
        fill="var(--accent-soft)"
        stroke="var(--primary)"
        strokeWidth="3"
      />

      <rect
        x="41"
        y="32"
        width="18"
        height="50"
        rx="4"
        fill="var(--accent)"
        stroke="var(--primary)"
        strokeWidth="3"
      />

      <rect
        x="64"
        y="20"
        width="18"
        height="62"
        rx="4"
        fill="var(--action)"
        stroke="var(--primary)"
        strokeWidth="3"
      />

      <path
        d="M24 40 L31 33 L39 38 L51 24 L59 29 L72 15"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M72 15 L70 24 M72 15 L63 17"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
