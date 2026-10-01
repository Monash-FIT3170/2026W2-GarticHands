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
  const base =
    'w-11 h-11 flex items-center justify-center rounded-full ' +
    'bg-white/10 border border-white/20 text-white ' +
    'shadow-md backdrop-blur-sm ' +
    'transition-all duration-200 ' +
    'hover:bg-white/20 hover:scale-105 ' +
    'focus:outline-none focus:ring-2 focus:ring-white/50';

  return (
    <div className="absolute top-5 right-6 flex gap-3">
      <button className={base} onClick={onVolume} aria-label="Volume">
        <VolumeIcon className="w-6 h-6" />
      </button>

      <button className={base} onClick={onSettings} aria-label="Settings">
        <GearIcon className="w-6 h-6" />
      </button>

      <button className={base} onClick={onRules} aria-label="Rules">
        <BookIcon className="w-6 h-6" />
      </button>
    </div>
  );
}