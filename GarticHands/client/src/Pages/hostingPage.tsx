import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createRoom, getRoom, startRoom } from '../api/room';
import { Page, Card, Button, useToast } from '../components/ui';
import PlayerList from '../components/PlayerList';
import { useLeaveRoom } from '../hooks/useLeaveRoom';
import { usePlayerDepartures } from '../hooks/usePlayerDepartures';
import type { Player, DrawLocationState } from '../types/room';

const MAX_PLAYERS_DISPLAY = 8;
const MAX_PLAYERS = 8;

export default function HostingPage() {
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [aiMode, setAiMode] = useState(false);
  const [roomCreated, setRoomCreated] = useState(false);
  const { toast, show } = useToast('pill');

  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as DrawLocationState | null;
  const hostName = state?.playerName;

  // Only create room once user clicks "Create Room"
  async function handleCreateRoom() {
    if (!hostName) {
      void navigate('/');
      return;
    }

    const data = await createRoom(hostName, aiMode);

    if (data.success && data.roomCode && data.room) {
      setRoomCode(data.roomCode);
      setPlayers(data.room.players);
      setRoomCreated(true);
    }
  }

  useEffect(() => {
    if (!roomCode || !hostName || !roomCreated) return;

    async function loadRoom() {
      const data = await getRoom(roomCode, hostName);
      if (!data.success || !data.room) return;

      const stillIn = data.room.players.some((p: Player) => p.name === hostName);

      if (!stillIn) {
        void navigate('/');
        return;
      }

      setPlayers(data.room.players);
    }

    void loadRoom();

    const interval = setInterval(() => {
      void loadRoom();
    }, 1000);

    return () => clearInterval(interval);
  }, [roomCode, hostName, navigate, roomCreated]);

  usePlayerDepartures(players, (names) => show(`${names.join(', ')} left the room`));

  const leaveRoom = useLeaveRoom(roomCode || undefined, hostName);

  const humanPlayers = players.filter((p) => !p.isAI);
  const readyCount = humanPlayers.filter((p) => p.ready || p.isHost).length;
  const allReady = humanPlayers.length > 0 && humanPlayers.every((p) => p.ready || p.isHost);

  async function handleLeave() {
    await leaveRoom();
    void navigate('/');
  }

  function copyCode() {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).catch(() => {});
    show('Invite code copied!');
  }

  async function handleStart() {
    if (!allReady || !hostName) return;

    await startRoom(roomCode);
    show('Starting game...');

    setTimeout(() => {
      void navigate('/input', {
        state: { roomCode, playerName: hostName },
      });
    }, 1200);
  }

  // ── PRE-ROOM SCREEN — choose mode before creating ──
  if (!roomCreated) {
    return (
      <Page variant="centered" logo>
        <Card variant="lobby">
          <div className="flex flex-col items-center gap-6 p-4">
            <h2 className="text-white text-2xl font-extrabold tracking-wide">
              CHOOSE GAMEMODE
            </h2>

            <div className="flex flex-col gap-4 w-full max-w-[220px]">
              {/* Classic */}
              <button
                className="bg-[var(--surface)] rounded-lg border-4 border-[var(--accent)] flex flex-col items-center justify-center shadow-sm py-4"
              >
                <img
                  src="/gamemode_classic.png"
                  alt="Classic"
                  className="w-16 h-16 mb-2 object-contain"
                />
                <p className="text-[var(--primary)] font-extrabold">Classic</p>
              </button>

              {/* AI Mode toggle */}
              <button
                onClick={() => setAiMode(!aiMode)}
                className={`rounded-lg border-4 flex flex-col items-center justify-center shadow-sm py-4 transition-colors ${
                  aiMode
                    ? 'bg-indigo-600 border-indigo-400 text-white'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--primary)]'
                }`}
              >
                <span className="text-3xl mb-1">🤖</span>
                <p className="font-extrabold">AI Mode</p>
                <p className="text-xs opacity-70 mt-1">
                  {aiMode ? 'ON — AI will guess your drawing' : 'OFF'}
                </p>
              </button>
            </div>

            <Button
              variant="start"
              size="full"
              onClick={() => void handleCreateRoom()}
            >
              Create Room
            </Button>

            <Button
              variant="leave"
              size="full"
              onClick={() => void navigate('/')}
            >
              Back
            </Button>
          </div>
        </Card>
      </Page>
    );
  }

  // ── LOBBY SCREEN — after room is created ──
  return (
    <Page variant="centered" logo>
      <Card variant="lobby">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8">
          <section className="color-vision-lobby-section rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white text-2xl font-extrabold tracking-wide">
                PLAYERS {players.length}/{MAX_PLAYERS}
              </h2>

              <p className="text-white/80 text-sm font-semibold">
                {readyCount}/{humanPlayers.length} ready
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
            <div className="color-vision-lobby-section rounded-xl p-6 w-full flex flex-col items-center">
              <h2 className="text-white text-2xl font-extrabold tracking-wide mb-3">
                GAMEMODE
              </h2>

              <div className="flex flex-col items-center gap-2">
                <button className="bg-[var(--surface)] rounded-lg border-4 border-[var(--accent)] flex flex-col items-center justify-center shadow-sm w-full max-w-[160px] py-3">
                  <img
                    src="/gamemode_classic.png"
                    alt="Classic"
                    className="w-12 h-12 mb-1 object-contain"
                  />
                  <p className="text-[var(--primary)] font-extrabold text-sm">Classic</p>
                </button>

                {aiMode && (
                  <div className="flex items-center gap-2 bg-indigo-600 rounded-lg px-3 py-2">
                    <span className="text-lg">🤖</span>
                    <p className="text-white font-bold text-sm">AI Mode ON</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 w-full flex flex-col items-center gap-2">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">
                Room Code
              </p>

              <p className="text-white font-mono font-extrabold text-4xl tracking-[0.3em]">
                {roomCode}
              </p>

              <Button variant="outline" size="full" onClick={copyCode}>
                <span className="flex items-center justify-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy Room Code
                </span>
              </Button>
            </div>

            <Button
              variant="start"
              size="full"
              onClick={() => void handleStart()}
              disabled={!allReady}
              className="mt-4"
            >
              {allReady ? 'Start Game' : 'Waiting for Players'}
            </Button>

            <Button
              variant="leave"
              size="full"
              onClick={() => void handleLeave()}
              className="mt-3"
            >
              Leave Room
            </Button>
          </section>
        </div>
      </Card>

      {toast}
    </Page>
  );
}