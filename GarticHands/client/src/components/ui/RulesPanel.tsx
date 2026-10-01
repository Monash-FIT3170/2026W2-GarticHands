import { Button } from './index';

interface RulesPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function RulesPanel({ open, onClose }: RulesPanelProps) {
  if (!open) return null;

  const rules = [
    'Get a prompt',
    'Draw the prompt you receive',
    'Pinch to draw',
    'Use Eraser mode to erase',
    'Use Pencil mode to draw',
    'Submit your drawing',
    'See how it turned out!',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-title"
        className="w-full max-w-md rounded-3xl bg-[var(--card-bg)] border-2 border-white/30 shadow-2xl p-7"
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            id="rules-title"
            className="text-2xl font-extrabold text-white"
          >
            How to Play
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close rules"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors text-xl font-bold"
          >
            ×
          </button>
        </div>

        <ol className="space-y-3">
          {rules.map((rule, index) => (
            <li
              key={rule}
              className="flex items-center gap-3 text-[var(--text-primary)] font-medium"
            >
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--primary)] text-white font-bold text-sm">
                {index + 1}
              </span>

              <span className="text-white">{rule}</span>
            </li>
          ))}
        </ol>

        <Button
          variant="primary"
          size="full"
          onClick={onClose}
          className="mt-7"
        >
          Got it!
        </Button>
      </div>
    </div>
  );
}