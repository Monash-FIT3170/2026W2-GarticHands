import {
  COLOR_VISION_MODES,
  GESTURE_SENSITIVITIES,
  STROKE_SMOOTHING_LEVELS,
  useSettings,
  type ColorVisionMode,
  type GestureSensitivity,
  type StrokeSmoothing,
} from '../../state/SettingsContext';

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

// Distinct from the colour-vision "Default" label on purpose — every radio in
// the dialog keeps a unique accessible name.
const SENSITIVITY_LABELS: Record<GestureSensitivity, string> = {
  low: 'Low',
  default: 'Medium (default)',
  high: 'High',
};

const SMOOTHING_LABELS: Record<StrokeSmoothing, string> = {
  light: 'Light',
  default: 'Balanced (default)',
  strong: 'Strong',
};

/**
 * Settings popover anchored under the top-right gear button — hosts the
 * colour-vision palette picker (User Story 25) and the drawing adjustments:
 * gesture sensitivity and stroke smoothing. Closed by default and renders
 * `null` while closed, so default-state pages stay pixel-identical to before.
 *
 * State lives in `SettingsContext`; this primitive only reads/writes it.
 */
export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  if (!open) return null;
  return <SettingsPanelContent onClose={onClose} />;
}

/** Labelled, keyboard-accessible radio group — one per setting. */
function SettingsRadioGroup<T extends string>({
  legend,
  name,
  options,
  labels,
  value,
  onChange,
  className,
}: {
  legend: string;
  name: string;
  options: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (option: T) => void;
  className?: string;
}) {
  return (
    <fieldset className={className}>
      <legend className="mb-1 font-bold">{legend}</legend>
      <div className="flex flex-col gap-1">
        {options.map((option) => (
          <label key={option} className="flex cursor-pointer items-center gap-2 font-semibold">
            <input
              type="radio"
              name={name}
              value={option}
              aria-label={labels[option]}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            {labels[option]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Inner component so `useSettings` is only called while the panel is open —
 * a closed panel can therefore render outside a `<SettingsProvider>` (tests,
 * isolated stories) without throwing.
 */
function SettingsPanelContent({ onClose }: { onClose: () => void }) {
  const {
    colorVision,
    setColorVision,
    gestureSensitivity,
    setGestureSensitivity,
    strokeSmoothing,
    setStrokeSmoothing,
  } = useSettings();

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
      <SettingsRadioGroup
        legend="Colour vision"
        name="color-vision-mode"
        options={COLOR_VISION_MODES}
        labels={MODE_LABELS}
        value={colorVision}
        onChange={setColorVision}
      />
      <SettingsRadioGroup
        className="mt-3"
        legend="Gesture sensitivity"
        name="gesture-sensitivity-level"
        options={GESTURE_SENSITIVITIES}
        labels={SENSITIVITY_LABELS}
        value={gestureSensitivity}
        onChange={setGestureSensitivity}
      />
      <SettingsRadioGroup
        className="mt-3"
        legend="Stroke smoothing"
        name="stroke-smoothing-level"
        options={STROKE_SMOOTHING_LEVELS}
        labels={SMOOTHING_LABELS}
        value={strokeSmoothing}
        onChange={setStrokeSmoothing}
      />
    </div>
  );
}
