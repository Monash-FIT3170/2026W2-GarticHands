import VolumeIcon from './icons/VolumeIcon';
import GearIcon from './icons/GearIcon';
import BookIcon from './icons/BookIcon';

interface TopRightButtonsProps {
  onVolume?: () => void;
  onSettings?: () => void;
  onRules?: () => void;
}

export default function TopRightButtons({
  onVolume,
  onSettings,
  onRules,
}: TopRightButtonsProps) {
  const base = 'hover:text-[var(--icon-hover)] transition-colors';

  return (
    <div className="absolute top-5 right-6 flex gap-5 text-[var(--icon)]">
      <button className={base} onClick={onVolume} aria-label="Volume">
        <VolumeIcon className="w-7 h-7" />
      </button>

      <button className={base} onClick={onSettings} aria-label="Settings">
        <GearIcon className="w-7 h-7" />
      </button>

      <button className={base} onClick={onRules} aria-label="Rules">
        <BookIcon className="w-7 h-7" />
      </button>
    </div>
  );
}