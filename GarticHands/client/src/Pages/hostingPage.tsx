import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createRoom, getRoom, startRoom } from '../api/room';
import { Page, Card, Button, useToast } from '../components/ui';
import PlayerList from '../components/PlayerList';
import type { Player, DrawLocationState } from '../types/room';

const MAX_PLAYERS_DISPLAY = 4;
const MAX_PLAYERS = 4;

export default function HostingPage() {
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const { toast, show } = useToast('pill');

  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as DrawLocationState | null;
  const hostName = state?.playerName;

  useEffect(() => {
    async function setupRoom() {
      if (!hostName) {
        void navigate('/');
        return;
      }
      const data = await createRoom(hostName);
      if (data.success) {
        setRoomCode(data.roomCode);
        setPlayers(data.room.players);
      }
    }
    void setupRoom();
  }, [hostName, navigate]);

  useEffect(() => {
    if (!roomCode) return;
    async function loadRoom() {
      const data = await getRoom(roomCode);
      if (data.success) setPlayers(data.room.players);
    }
    void loadRoom();
    const interval = setInterval(() => {
      void loadRoom();
    }, 1000);
    return () => clearInterval(interval);
  }, [roomCode]);

  const readyCount = players.filter((p) => p.ready || p.isHost).length;
  const allReady = players.length > 0 && players.every((p) => p.ready || p.isHost);

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
      void navigate('/input', { state: { roomCode, playerName: hostName } });
    }, 1200);
  }

  return (
    <Page variant="centered" logo>
      <Card variant="lobby">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8">
          <section className="rounded-xl p-6" style={{ backgroundColor: 'rgba(22, 89, 74, 0.2)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white text-2xl font-extrabold tracking-wide">
                PLAYERS {players.length}/{MAX_PLAYERS}
              </h2>
              <p className="text-white/80 text-sm font-semibold">
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
            <div
              className="rounded-xl p-6 w-full flex flex-col items-center"
              style={{ backgroundColor: 'rgba(22, 89, 74, 0.2)' }}
            >
              <h2 className="text-white text-2xl font-extrabold tracking-wide mb-5">GAMEMODE</h2>
              <GamemodeSelect />
            </div>

            <Button variant="outline" size="full" onClick={copyCode} className="mt-6">
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

            <Button
              variant="start"
              size="full"
              onClick={() => void handleStart()}
              disabled={!allReady}
              className="mt-4"
            >
              {allReady ? 'Start Game' : 'Waiting for Players'}
            </Button>
          </section>
        </div>
      </Card>

      {toast}
    </Page>
  );
}

function GamemodeSelect() {
  return (
    <div className="grid grid-cols-1 gap-4 w-full max-w-[200px]">
      <button className="bg-white rounded-lg border-4 border-[#78EF57] flex flex-col items-center justify-center shadow-sm">
        <img src="/gamemode_classic.png" alt="Classic" className="w-16 h-16 mb-2 object-contain" />
        <p className="text-[#2E5534] font-extrabold">Classic</p>
      </button>
    </div>
  );
}
