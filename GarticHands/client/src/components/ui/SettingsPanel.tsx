import { COLOR_VISION_MODES, useSettings, type ColorVisionMode } from '../../state/SettingsContext';

interface SettingsPanelProps {
  /** Whether the panel is visible. A closed panel renders nothing at all. */
  open: boolean;
  /** Called when the user dismisses the panel (close button or Escape). */
  onClose: () => void;
}

const MODE_LABELS: Record<ColorVisionMode, string> = {
  default: 'Default',
  deuteranopia: 'Deuteranopia friendly',
  protanopia: 'Protanopia friendly',
  tritanopia: 'Tritanopia friendly',
};

/**
 * Settings popover anchored under the top-right gear button — currently hosts the
 * colour-vision palette picker (User Story 25). Closed by default and renders
 * `null` while closed, so default-state pages stay pixel-identical to before.
 *
 * State lives in `SettingsContext`; this primitive only reads/writes it.
 */
export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  if (!open) return null;
  return <SettingsPanelContent onClose={onClose} />;
}

/**
 * Inner component so `useSettings` is only called while the panel is open —
 * a closed panel can therefore render outside a `<SettingsProvider>` (tests,
 * isolated stories) without throwing.
 */
function SettingsPanelContent({ onClose }: { onClose: () => void }) {
  const { colorVision, setColorVision } = useSettings();

  return (
    <div
      role="dialog"
      aria-label="Settings"
      className="absolute top-16 right-6 z-50 w-64 rounded-xl bg-white/95 p-4 shadow-xl text-[#3D6B64]"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.12em]">Settings</h2>
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
            <label key={mode} className="flex cursor-pointer items-center gap-2 font-semibold">
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
