import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, Avatar } from '../components/ui';

export default function LandingPage() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');

  const canContinue = playerName.trim().length > 0;

  function joinRoom() {
    if (!canContinue) return;

    void navigate('/join', { state: { playerName: playerName.trim() } });
  }

  /** Game mode is chosen on the hosting screen. */
  function hostRoom() {
    if (!canContinue) return;

    void navigate('/host', { state: { playerName: playerName.trim() } });
  }

  return (
    <Page variant="centered" logo padding="px-4 py-8">
      <div className="w-full max-w-md">
        {/* Profile / username panel */}
        <section
          className="
            bg-white/90
            border border-white/70
            backdrop-blur-md
            rounded-3xl
            shadow-2xl
            p-7 sm:p-8
            flex flex-col
            items-center
            justify-center
            text-center
          "
        >
          <div className="mb-5">
            <Avatar variant="guest" />
          </div>

          <p className="text-[var(--text-secondary)] text-xs font-extrabold uppercase tracking-[0.25em]">
            Welcome, artist
          </p>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--primary)] mt-2">
            Ready to draw?
          </h1>

          <p className="text-[var(--text-secondary)] font-medium mt-2 mb-6 max-w-xs">
            Enter your name and choose how you want to play.
          </p>

          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter username..."
            maxLength={20}
            className="
              w-full
              bg-white
              rounded-2xl
              px-5 py-4
              text-center
              text-[var(--input-text)]
              placeholder:text-[var(--input-placeholder)]
              font-semibold
              border-4 border-[var(--accent)]
              outline-none
              focus:ring-4 focus:ring-[var(--accent)]/20
              focus:border-[var(--accent)]
              transition-all
            "
          />

          <div className="flex flex-col sm:flex-row gap-3 w-full mt-5">
            <button
              type="button"
              onClick={joinRoom}
              disabled={!canContinue}
              className="
                flex-1
                bg-white
                text-[var(--text-primary)]
                border-2 border-[var(--accent-soft)]
                rounded-xl
                px-4 py-3
                font-extrabold
                transition-all
                hover:-translate-y-0.5
                hover:shadow-lg
                hover:border-[var(--accent)]
                disabled:opacity-40
                disabled:cursor-not-allowed
              "
            >
              Join Room
            </button>

            <button
              type="button"
              onClick={hostRoom}
              disabled={!canContinue}
              className="
                flex-1
                bg-[var(--accent)]
                text-[var(--primary)]
                rounded-xl
                px-4 py-3
                font-extrabold
                transition-all
                hover:-translate-y-0.5
                hover:shadow-lg
                hover:bg-[var(--accent-hover)]
                disabled:opacity-40
                disabled:cursor-not-allowed
              "
            >
              Host Game
            </button>
          </div>
        </section>

        <p className="text-white/50 text-xs font-medium text-center mt-5">
          Choose Host Game to pick a mode, or Join Room to play with friends.{' '}
          <button
            type="button"
            onClick={() => void navigate('/how-to-play')}
            className="font-bold text-white/90 underline underline-offset-2 hover:text-white"
          >
            New here? See how to play
          </button>
        </p>
      </div>
    </Page>
  );
}
