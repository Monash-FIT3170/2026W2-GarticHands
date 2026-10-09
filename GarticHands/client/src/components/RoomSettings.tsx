interface RoomSettingsProps {
  drawTimeSeconds: number;
  maxRounds: number;
  disabled: boolean;
  onDrawTimeChange: (value: number) => void;
  onRoundsChange: (value: number) => void;
}

const DRAW_TIME_OPTIONS = [30, 45, 60, 90, 120, 150, 180, 240, 300, 360];
const ROUND_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function RoomSettings({
  drawTimeSeconds,
  maxRounds,
  disabled,
  onDrawTimeChange,
  onRoundsChange,
}: RoomSettingsProps) {
  const drawTimeIndex = Math.max(0, DRAW_TIME_OPTIONS.indexOf(drawTimeSeconds));
  const roundsIndex = Math.max(0, ROUND_OPTIONS.indexOf(maxRounds));

  return (
    <section
      aria-label="Room settings"
      className={`mt-5 space-y-5 ${disabled ? 'opacity-60' : ''}`}
    >
      <DiscreteSlider
        label="Draw Time (seconds)"
        options={DRAW_TIME_OPTIONS}
        valueIndex={drawTimeIndex}
        disabled={disabled}
        onChange={(index) => onDrawTimeChange(DRAW_TIME_OPTIONS[index])}
      />
      <DiscreteSlider
        label="Rounds"
        options={ROUND_OPTIONS}
        valueIndex={roundsIndex}
        disabled={disabled}
        onChange={(index) => onRoundsChange(ROUND_OPTIONS[index])}
      />
    </section>
  );
}

function DiscreteSlider({
  label,
  options,
  valueIndex,
  disabled,
  onChange,
}: {
  label: string;
  options: number[];
  valueIndex: number;
  disabled: boolean;
  onChange: (index: number) => void;
}) {
  const percent = (valueIndex / (options.length - 1)) * 100;

  return (
    <div
      className="relative w-full"
      title={disabled ? 'Only the host can modify room settings' : undefined}
    >
      <label className="mb-1 block text-center text-xl font-bold text-white">{label}</label>
      <div className="mb-1 flex justify-between text-sm font-semibold text-white">
        <span>{options[0]}</span>
        <span>{options[options.length - 1]}</span>
      </div>
      <div className={`relative flex h-8 items-center ${disabled ? 'room-slider-disabled' : ''}`}>
        <input
          aria-label={label}
          aria-valuetext={`${options[valueIndex]}${label === 'Draw Time (seconds)' ? ' seconds' : ''}`}
          aria-description={disabled ? 'Only the host can modify room settings' : undefined}
          className="room-slider relative z-10 w-full"
          type="range"
          min={0}
          max={options.length - 1}
          step={1}
          value={valueIndex}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.currentTarget.value))}
        />
        <output
          aria-live="polite"
          className="pointer-events-none absolute z-20 flex h-[38px] w-[38px] -translate-x-1/2 items-center justify-center text-base font-extrabold text-[var(--action)]"
          style={{
            left: `${percent}%`,
            marginLeft: `${19 - (38 * percent) / 100}px`,
          }}
        >
          {options[valueIndex]}
        </output>
      </div>
    </div>
  );
}
