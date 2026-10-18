import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  addBot,
  createRoom,
  getRoom,
  leaveRoom as removePlayer,
  startRoom,
  updateRoomSettings,
} from '../api/room';
import { Page, Card, Button } from '../components/ui';
import PlayerList from '../components/PlayerList';
import RoomSettings from '../components/RoomSettings';
import GameModeList from '../components/GameModeList';
import { useLeaveRoom } from '../hooks/useLeaveRoom';
import { usePlayerDepartures } from '../hooks/usePlayerDepartures';
import type { GameMode, Player, DrawLocationState } from '../types/room';

const MAX_PLAYERS_DISPLAY = 8;
const MAX_PLAYERS = 8;
/** Mirrors `MAX_BOTS` in `server/ai/bots.js`. */
const MAX_BOTS = 5;

export default function HostingPage() {
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [drawTimeSeconds, setDrawTimeSeconds] = useState(60);
  const [maxRounds, setMaxRounds] = useState(4);
  const [popup, setPopup] = useState('');
  const [roomCreated, setRoomCreated] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const createStarted = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as
    | (DrawLocationState & {
        mode?: GameMode;
        /** Bots to add as soon as the room exists — set by the AI Mode quick start. */
        bots?: number;
      })
    | null;

  const hostName = state?.playerName;
  const [gameMode, setGameMode] = useState<GameMode>(state?.mode ?? 'classic');
  const startingBots = state?.bots ?? 0;

  async function handleCreateRoom() {
    if (!hostName) {
      void navigate('/');
      return;
    }

    const data = await createRoom(hostName, gameMode, aiMode);

    if (data.success && data.roomCode && data.room) {
      let room = data.room;
      for (let i = 0; i < startingBots; i += 1) {
        const withBot = await addBot(data.roomCode, hostName);
        if (withBot.success && withBot.room) room = withBot.room;
      }

      setRoomCode(data.roomCode);
      setPlayers(room.players);
      setDrawTimeSeconds(data.room.drawTimeSeconds ?? 60);
      setMaxRounds(data.room.maxRounds);
      setRoomCreated(true);
    }
  }

  // The room exists as soon as the host arrives; the mode is picked in the lobby.
  useEffect(() => {
    if (createStarted.current) return;
    createStarted.current = true;
    void handleCreateRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- create exactly once
  }, []);

  useEffect(() => {
    if (!roomCode || !hostName || !roomCreated) return;

    let cancelled = false;

    async function pollRoom() {
      try {
        const data = await getRoom(roomCode, hostName);
        if (!cancelled && data.success && data.room) {
          setPlayers(data.room.players);
          setDrawTimeSeconds(data.room.drawTimeSeconds ?? 60);
          setMaxRounds(data.room.maxRounds);
          setGameMode(data.room.mode ?? 'classic');
          setAiMode(data.room.aiMode ?? false);
        }
      } catch {
        // Retry on next poll
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
  }, [roomCode, hostName, roomCreated]);

  // Only announce people leaving — removing a bot is the host's own choice.
  const humans = useMemo(() => players.filter((player) => !player.isBot), [players]);

  usePlayerDepartures(humans, (names) => {
    setPopup(`${names.join(', ')} left the room`);
  });

  const leaveRoom = useLeaveRoom(roomCode || undefined, hostName);

  const readyCount = players.filter((p) => p.ready || p.isHost).length;
  const isHost = players.some((p) => p.name === hostName && p.isHost);
  const allReady = players.length > 0 && players.every((p) => p.ready || p.isHost);

  const copyCode = useCallback(() => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setPopup('Room code copied');
  }, [roomCode]);

  async function handleLeave() {
    await leaveRoom();
    void navigate('/');
  }

  async function saveRoomSettings(settings: {
    drawTimeSeconds?: number;
    maxRounds?: number;
    mode?: GameMode;
    aiMode?: boolean;
  }) {
    if (!roomCode || !hostName) return;
    try {
      const data = await updateRoomSettings(roomCode, hostName, settings);
      if (!data.success || !data.room) {
        setPopup(data.message ?? 'Unable to update room settings.');
        return;
      }
      setDrawTimeSeconds(data.room.drawTimeSeconds ?? 60);
      setMaxRounds(data.room.maxRounds);
      setGameMode(data.room.mode ?? 'classic');
      setAiMode(data.room.aiMode ?? false);
    } catch {
      setPopup('Unable to update room settings. Please try again.');
    }
  }

  const botCount = players.filter((player) => player.isBot).length;
  const canAddBot = isHost && players.length < MAX_PLAYERS && botCount < MAX_BOTS;

  async function handleAddBot() {
    if (!roomCode || !hostName) return;

    const data = await addBot(roomCode, hostName);
    if (data.success && data.room) {
      setPlayers(data.room.players);
    } else {
      setPopup(data.message ?? 'Unable to add a bot.');
    }
  }

  async function handleRemoveBot(name: string) {
    if (!roomCode) return;

    const data = await removePlayer(roomCode, name);
    if (data.success && data.room) setPlayers(data.room.players);
  }

  async function handleStart() {
    if (!allReady || !hostName) return;

    if (gameMode === 'classic' && players.length < 3) {
      setPopup('Classic Mode needs at least 3 players. Switch to Showdown Mode to play with 2 players.');
      return;
    }

    if (gameMode === 'leaderboard' && players.length < 2) {
      setPopup('Showdown Mode needs at least 2 players.');
      return;
    }

    const data = await startRoom(roomCode);
    if (!data.success) {
      setPopup(data.message ?? 'Unable to start the game.');
      return;
    }

    void navigate('/input', { state: { roomCode, playerName: hostName } });
  }

  async function launchSoloMode(mode: 'playground' | 'solo') {
    await leaveRoom();
    void navigate(mode === 'playground' ? '/playground' : '/solo');
  }

  // ── LOBBY SCREEN ──
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
              onRemoveBot={isHost ? (name) => void handleRemoveBot(name) : undefined}
            />

            {isHost && (
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-white/80">
                  Short on players? Bots write prompts, draw and guess.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleAddBot()}
                  disabled={!canAddBot}
                  className="shrink-0"
                >
                  🤖 Add bot
                </Button>
              </div>
            )}

            <RoomSettings
              drawTimeSeconds={drawTimeSeconds}
              maxRounds={maxRounds}
              disabled={!isHost}
              onDrawTimeChange={(value) => {
                setDrawTimeSeconds(value);
                void saveRoomSettings({ drawTimeSeconds: value });
              }}
              onRoundsChange={(value) => {
                setMaxRounds(value);
                void saveRoomSettings({ maxRounds: value });
              }}
            />
          </section>

          <section className="flex flex-col items-center">
            <div className="color-vision-lobby-section flex w-full flex-col items-center rounded-xl p-6">
              <h2 className="mb-5 text-2xl font-extrabold tracking-wide text-white">GAMEMODE</h2>

              <GameModeList
                mode={gameMode}
                aiMode={aiMode}
                disabled={!isHost}
                onRoomModeChange={(mode, ai) => {
                  setGameMode(mode);
                  setAiMode(ai);
                  void saveRoomSettings({ mode, aiMode: ai });
                }}
                onLaunch={(mode) => void launchSoloMode(mode)}
              />
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <Button variant="start" size="full" onClick={onClose} className="mt-6">OK</Button>
      </div>
    </div>
  );
}
