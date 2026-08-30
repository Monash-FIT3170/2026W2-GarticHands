import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, RoundHeader, useToast } from '../components/ui';
import { getRoom, restartRoom, endRoom } from '../api/room';
import { useRecordings, type Recording } from '../state/RecordingsContext';
import { buildRevealChains, type RevealChain } from '../utils/revealChains';
import type { Player, Room, DrawLocationState } from '../types/room';

type EndView = 'cards' | 'slideshow' | 'recordings';

export default function GamePage() {
  const location = useLocation();
  const state = location.state as DrawLocationState | null;
  const navigate = useNavigate();
  const roomCode = state?.roomCode;
  const playerName = state?.playerName;
  const joinedLate = state?.joinedLate ?? false;

  const [room, setRoom] = useState<Room | null>(null);
  const [working, setWorking] = useState(false);
  const [view, setView] = useState<EndView>('cards');
  const { recordings, clearRecordings } = useRecordings();
  const { toast, show } = useToast('pill');

  useEffect(() => {
    if (joinedLate) show('You joined mid-round — you’ll play from the next round!');
  }, [joinedLate, show]);

  useEffect(() => {
    if (!roomCode || !playerName) {
      void navigate('/');
      return;
    }

    let cancelled = false;

    async function load() {
      if (!roomCode) return;
      // Passing the name doubles as this player's presence heartbeat.
      const data = await getRoom(roomCode, playerName);
      if (cancelled || !data.success || !data.room) return;

      // Dropped by the server while we were away — the room carries on without us.
      if (playerName && !data.room.players.some((p: Player) => p.name === playerName)) {
        cancelled = true;
        void navigate('/');
        return;
      }

      setRoom(data.room);

      // Mid-round joiners stay here until the round they joined during is
      // over; the server clears the flag once a fresh round begins.
      const me = data.room.players.find((p) => p.name === playerName);
      const sittingOut = me?.joinedMidRound === true;

      if (data.room.phase === 'prompt' && !sittingOut) {
        cancelled = true;
        void navigate('/input', { state: { roomCode, playerName } });
        return;
      }
      if (data.room.phase === 'lobby') {
        cancelled = true;
        void navigate(`/joined/${roomCode}`, { state: { roomCode, playerName } });
      }
    }

    void load();
    const interval = setInterval(() => {
      void load();
    }, 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [roomCode, playerName, navigate]);

  const isHost = room?.players.find((p) => p.name === playerName)?.isHost ?? false;
  const round = room?.round ?? 1;
  const maxRounds = room?.maxRounds ?? 4;
  const isFinalRound = round >= maxRounds;
  const chains = room ? buildRevealChains(room) : [];
  // True while a mid-round joiner is waiting for the current round to finish.
  const roundInProgress = room !== null && room.phase !== 'reveal' && room.phase !== 'lobby';

  async function handlePlayAgain() {
    if (!roomCode || working) return;
    setWorking(true);
    await restartRoom(roomCode);
  }

  async function handleBackToLobby() {
    if (!roomCode || working) return;
    setWorking(true);
    // Recordings are local to the player's browser — clear them at end-of-game.
    clearRecordings();
    await endRoom(roomCode);
  }

  return (
    <div className="background !justify-start">
      <Card variant="glass" className="w-full !max-w-3xl">
        <RoundHeader round={round} totalRounds={maxRounds} />
        <h1 className="text-3xl mb-4">{roundInProgress ? 'Round in Progress' : 'Reveal'}</h1>

        {!room && <p className="text-sm text-white/70">Loading results...</p>}

        {roundInProgress && (
          <div className="bg-white/[0.10] border border-white/[0.20] rounded-xl p-6 text-center">
            <p className="text-sm text-white/80 font-semibold">
              Round {round} is still being played...
            </p>
            <p className="text-xs text-white/60 mt-2">
              You joined mid-round — hang tight, you&apos;ll jump in when the next round starts.
            </p>
          </div>
        )}

        {room && !roundInProgress && (
          <ViewTabs view={view} onChange={setView} recordingsCount={recordings.length} />
        )}

        {!roundInProgress && view === 'cards' && <CardsView chains={chains} />}

        {!roundInProgress && view === 'slideshow' && (
          <SlideshowView chains={chains.filter((c) => c.drawing)} />
        )}

        {!roundInProgress && view === 'recordings' && <RecordingsView recordings={recordings} />}

        <div className="flex flex-col items-end mt-6 gap-2">
          {roundInProgress ? (
            <p className="text-sm text-white/70">Waiting for the round to finish...</p>
          ) : isHost ? (
            isFinalRound ? (
              <Button
                variant="outline"
                size="full"
                onClick={() => void handleBackToLobby()}
                disabled={working}
              >
                {working ? 'Returning...' : 'Back to Lobby'}
              </Button>
            ) : (
              <Button
                variant="start"
                size="full"
                onClick={() => void handlePlayAgain()}
                disabled={working}
              >
                {working ? 'Starting...' : `Play Round ${round + 1}`}
              </Button>
            )
          ) : (
            <p className="text-sm text-white/70">
              {isFinalRound
                ? 'Waiting for the host to return to the lobby...'
                : 'Waiting for the host to start the next round...'}
            </p>
          )}
        </div>
      </Card>

      {toast}
    </div>
  );
}

// ---------------------------------------------------------------------------
// View switcher
// ---------------------------------------------------------------------------

interface ViewTabsProps {
  view: EndView;
  onChange: (v: EndView) => void;
  recordingsCount: number;
}

function ViewTabs({ view, onChange, recordingsCount }: ViewTabsProps) {
  const tabs: Array<{ id: EndView; label: string }> = [
    { id: 'cards', label: 'Reveal' },
    { id: 'slideshow', label: 'Slideshow' },
    { id: 'recordings', label: `My Recordings (${recordingsCount})` },
  ];
  return (
    <div className="mb-4 inline-flex rounded-full bg-white/80 p-1 gap-1">
      {tabs.map((t) => {
        const selected = view === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
              selected ? 'bg-[#2E5534] text-white shadow-sm' : 'text-[#3D6B64] hover:bg-white'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reveal cards (original view)
// ---------------------------------------------------------------------------

function CardsView({ chains }: { chains: RevealChain[] }) {
  if (chains.length === 0) {
    return <p className="text-sm text-white/70">No drawings to reveal.</p>;
  }
  return (
    <div className="space-y-6">
      {chains.map((chain) => (
        <div
          key={chain.drawer.name}
          className="bg-white/[0.10] border border-white/[0.20] rounded-xl p-4"
        >
          <p className="text-sm text-white/80">
            <span className="font-semibold">{chain.drawer.name}</span> wrote:{' '}
            <span className="italic">&quot;{chain.prompt || '(no prompt)'}&quot;</span>
          </p>
          {chain.drawing ? (
            <img
              src={chain.drawing}
              alt={`Drawing by ${chain.drawer.name}`}
              className="w-full h-56 object-contain bg-black rounded-lg my-3"
            />
          ) : (
            <div className="w-full h-56 bg-white/[0.14] rounded-lg my-3 flex items-center justify-center text-sm text-white/70">
              No drawing submitted
            </div>
          )}
          <p className="text-sm text-white/80">
            <span className="font-semibold">{chain.guesserName}</span> guessed:{' '}
            <span className="italic">&quot;{chain.guess || '(no guess)'}&quot;</span>
          </p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slideshow — auto-advance through every drawing
// ---------------------------------------------------------------------------

const SLIDE_INTERVAL_MS = 4000;

function SlideshowView({ chains }: { chains: RevealChain[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const safeIndex = chains.length === 0 ? 0 : index % chains.length;

  useEffect(() => {
    if (!playing || chains.length <= 1) return;
    const t = setInterval(() => setIndex((i) => i + 1), SLIDE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [playing, chains.length]);

  if (chains.length === 0) {
    return <p className="text-sm text-white/70">No drawings were submitted this round.</p>;
  }

  const current = chains[safeIndex];

  return (
    <div className="flex flex-col items-center">
      <div className="bg-black rounded-xl w-full overflow-hidden">
        <img
          src={current.drawing}
          alt={`Drawing by ${current.drawer.name}`}
          className="w-full h-80 object-contain"
        />
      </div>
      <p className="text-sm text-white/80 mt-3 text-center">
        <span className="font-semibold">{current.drawer.name}</span> drew{' '}
        <span className="italic">&quot;{current.prompt || '(no prompt)'}&quot;</span>
      </p>
      <p className="text-xs text-white/60 mt-1 text-center">
        Guessed by <span className="font-semibold">{current.guesserName}</span>:{' '}
        <span className="italic">&quot;{current.guess || '(no guess)'}&quot;</span>
      </p>

      <div className="flex items-center gap-2 mt-4">
        <button
          type="button"
          onClick={() => setIndex((i) => (i - 1 + chains.length) % chains.length)}
          className="px-3 py-1.5 rounded-full bg-white/80 text-[#3D6B64] text-xs font-bold uppercase tracking-[0.12em] hover:bg-white"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="px-3 py-1.5 rounded-full bg-white/80 text-[#3D6B64] text-xs font-bold uppercase tracking-[0.12em] hover:bg-white"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % chains.length)}
          className="px-3 py-1.5 rounded-full bg-white/80 text-[#3D6B64] text-xs font-bold uppercase tracking-[0.12em] hover:bg-white"
        >
          Next
        </button>
        <span className="text-xs text-white/70 ml-2">
          {safeIndex + 1} / {chains.length}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recordings — the player's per-round drawing videos played back as one reel
// ---------------------------------------------------------------------------

function RecordingsView({ recordings }: { recordings: Recording[] }) {
  const sorted = useMemo(() => [...recordings].sort((a, b) => a.round - b.round), [recordings]);
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  if (sorted.length === 0) {
    return (
      <div className="bg-white/[0.10] border border-white/[0.20] rounded-xl p-6 text-center">
        <p className="text-sm text-white/80">
          No recordings yet — recordings appear here after you submit a drawing.
        </p>
        <p className="text-xs text-white/60 mt-2">
          (Recordings stay on your device — other players see only their own.)
        </p>
      </div>
    );
  }

  const current = sorted[Math.min(index, sorted.length - 1)];

  function handleEnded() {
    setIndex((i) => (i + 1 < sorted.length ? i + 1 : i));
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/80 mb-2">
        Round {current.round}
        {current.prompt && ` · "${current.prompt}"`}
      </p>
      <video
        ref={videoRef}
        key={current.blobUrl}
        src={current.blobUrl}
        controls
        autoPlay
        onEnded={handleEnded}
        className="w-full max-h-[460px] rounded-xl bg-black"
      />
      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="px-3 py-1.5 rounded-full bg-white/80 text-[#3D6B64] text-xs font-bold uppercase tracking-[0.12em] hover:bg-white disabled:opacity-50"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(sorted.length - 1, i + 1))}
          disabled={index >= sorted.length - 1}
          className="px-3 py-1.5 rounded-full bg-white/80 text-[#3D6B64] text-xs font-bold uppercase tracking-[0.12em] hover:bg-white disabled:opacity-50"
        >
          Next
        </button>
        <span className="text-xs text-white/70 ml-2">
          {index + 1} / {sorted.length}
        </span>
      </div>
    </div>
  );
}
