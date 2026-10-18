import { useNavigate } from 'react-router-dom';
import { Page, Button } from '../components/ui';

/**
 * Animated how-to-play guide. Every section pairs short steps with a GIF of
 * the real game, recorded by `scripts/howto/record.spec.ts` — re-run it when
 * a flow changes so the guide never shows a stale screen.
 *
 * Viewers who prefer reduced motion get the final frame as a still image.
 */

interface GuideSection {
  id: string;
  title: string;
  tagline: string;
  /** Base name of `public/howto/<clip>.gif` and its `.png` still. */
  clip: string;
  clipAlt: string;
  steps: string[];
}

const SECTIONS: GuideSection[] = [
  {
    id: 'gestures',
    title: 'Drawing with your hand',
    tagline: 'Start here — every mode uses the same controls.',
    clip: 'gestures',
    clipAlt:
      'A hand-tracked cursor pinches to draw a smiley face on the canvas, then switches to the eraser and rubs part of it out.',
    steps: [
      'Allow camera access and hold one hand up so the camera can see it.',
      'Press Start Drawing, then pinch your thumb and index finger together to put the pen down.',
      'Move your pinched hand to draw. Open your fingers to lift the pen.',
      'Use the toolbar to change colour and pen thickness, or switch to the eraser and pinch to rub out mistakes.',
      'Pick a layout (camera + canvas, draw on camera, or both) with the buttons above the canvas.',
    ],
  },
  {
    id: 'classic',
    title: 'Classic',
    tagline: 'Write a prompt, draw someone else’s, guess a third. 3–8 players.',
    clip: 'classic',
    clipAlt:
      'A Classic round: a player types a prompt, draws the prompt they were given, guesses another drawing, and sees the reveal.',
    steps: [
      'The host creates a room and shares the room code. Everyone else joins and presses Ready.',
      'Prompt: write something fun to draw, like “a penguin on a skateboard”.',
      'Draw: you get another player’s prompt. Draw it before the timer runs out.',
      'Guess: you see a drawing by someone else and type what you think it shows.',
      'Reveal: see every prompt, drawing and guess side by side, or play them as a slideshow.',
    ],
  },
  {
    id: 'leaderboard',
    title: 'Showdown',
    tagline: 'Draw, rate each other, climb the board. 2–8 players.',
    clip: 'leaderboard',
    clipAlt:
      'A Showdown round: a player draws their prompt, rates another drawing out of 100, and sees the ratings and leaderboard.',
    steps: [
      'Everyone writes a prompt, then draws the prompt they are handed.',
      'Rate: score another player’s drawing from 0 to 100.',
      'Rating reveal: see what everyone scored, then the host moves on to the leaderboard.',
      'Play more rounds — the highest score at the end wins.',
    ],
  },
  {
    id: 'ai',
    title: 'AI Mode — play with bots',
    tagline: 'No friends online? Bots fill the room and play every turn.',
    clip: 'ai-mode',
    clipAlt:
      'Choosing AI Mode on the home screen opens a lobby that already has two bots in it; the host adds one more bot and starts the game.',
    steps: [
      'Enter your name, open AI Mode and choose Classic vs Bots or Showdown vs Bot.',
      'The lobby opens with bots already seated — press Start Game.',
      'Bots write prompts, sketch simple drawings that are easy to guess, guess your drawings and rate them.',
      'Hosts of any room can also press Add bot in the lobby to fill empty seats (up to 5 bots).',
    ],
  },
  {
    id: 'solo',
    title: 'Solo',
    tagline: 'Practise on your own with random prompts.',
    clip: 'solo',
    clipAlt:
      'Solo mode: the computer shows a prompt, the player draws it, saves the drawing and gets the next prompt.',
    steps: [
      'The computer hands you a random prompt.',
      'Draw it, then press Save + New Prompt to keep it — or Skip Prompt for a different one.',
      'Your saved drawings collect underneath so you can see how you improve.',
    ],
  },
  {
    id: 'playground',
    title: 'Playground',
    tagline: 'A sandbox with no timer — and a bot you can ask to draw anything.',
    clip: 'playground',
    clipAlt:
      'In the Playground a player types “a rocket” into Watch a bot draw, and the bot sketches a rocket stroke by stroke.',
    steps: [
      'Test your camera and try every gesture and layout with no pressure.',
      'Take a snapshot of anything you draw.',
      'Type a prompt into Watch a bot draw to see how bots would sketch it.',
    ],
  },
];

export default function HowToPlayPage() {
  const navigate = useNavigate();

  return (
    <Page variant="flow" padding="px-4 pt-20 pb-10 sm:pt-10">
      <main className="relative w-full max-w-4xl">
        <header className="mb-6 text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-white/80">
            Gartic Hands
          </p>
          <h1 className="mt-1 text-4xl font-extrabold text-white">How to Play</h1>
          <p className="mt-2 font-medium text-white/85">
            Draw in the air with your hand, then guess or rate what everyone else drew.
          </p>
        </header>

        <nav aria-label="Guide sections" className="mb-6 flex flex-wrap justify-center gap-2">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full bg-white/90 px-4 py-1.5 text-sm font-bold text-[var(--primary)] transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-white"
            >
              {section.title}
            </a>
          ))}
        </nav>

        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <GuideCard key={section.id} section={section} />
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button variant="start" size="full" onClick={() => void navigate('/')}>
            Let’s play
          </Button>
        </div>
      </main>
    </Page>
  );
}

function GuideCard({ section }: { section: GuideSection }) {
  const gif = `/howto/${section.clip}.gif`;
  const still = `/howto/${section.clip}.png`;

  return (
    <section
      id={section.id}
      aria-labelledby={`${section.id}-title`}
      className="scroll-mt-6 rounded-3xl border border-white/70 bg-white/95 p-5 shadow-2xl sm:p-7"
    >
      <h2 id={`${section.id}-title`} className="text-2xl font-extrabold text-[var(--primary)]">
        {section.title}
      </h2>
      <p className="mt-1 font-medium text-[var(--text-secondary)]">{section.tagline}</p>

      <div className="mt-4 grid grid-cols-1 items-start gap-5 md:grid-cols-[1.3fr_1fr]">
        <figure className="overflow-hidden rounded-2xl border-4 border-[var(--accent)] bg-[var(--surface)]">
          <picture>
            <source srcSet={still} media="(prefers-reduced-motion: reduce)" />
            <img
              src={gif}
              alt={section.clipAlt}
              loading="lazy"
              width={640}
              height={400}
              className="block h-auto w-full"
            />
          </picture>
        </figure>

        <ol className="space-y-3">
          {section.steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-[var(--text-primary)]">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-white">
                {index + 1}
              </span>
              <span className="font-medium leading-snug">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
