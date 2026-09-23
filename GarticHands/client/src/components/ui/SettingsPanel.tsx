import { COLOR_VISION_MODES, useSettings, type ColorVisionMode } from '../../state/SettingsContext';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

const MODE_LABELS: Record<ColorVisionMode, string> = {
  default: 'Default',
  deuteranopia: 'Deuteranopia friendly',
  protanopia: 'Protanopia friendly',
  tritanopia: 'Tritanopia friendly',
};

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  if (!open) return null;
  return <SettingsPanelContent onClose={onClose} />;
}

function SettingsPanelContent({ onClose }: { onClose: () => void }) {
  const { colorVision, setColorVision } = useSettings();

  return (
    <div
      role="dialog"
      aria-label="Settings"
      className="absolute top-16 right-6 z-50 w-64 rounded-xl bg-[var(--surface)] p-4 shadow-xl text-[var(--text-primary)]"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.12em]">
          Settings
        </h2>

        <button
          className="px-2 rounded font-bold hover:bg-black/10"
          onClick={onClose}
          aria-label="Close settings"
        >
          ✕
        </button>
      </div>

      <fieldset>
        <legend className="mb-1 font-bold">Colour vision</legend>

        <div className="flex flex-col gap-1">
          {COLOR_VISION_MODES.map((mode) => (
            <label
              key={mode}
              className="flex cursor-pointer items-center gap-2 font-semibold"
            >
              <input
                type="radio"
                name="color-vision-mode"
                value={mode}
                aria-label={MODE_LABELS[mode]}
                checked={colorVision === mode}
                onChange={() => setColorVision(mode)}
              />
              {MODE_LABELS[mode]}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}