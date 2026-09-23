import { useState, type ReactNode } from 'react';
import TopRightButtons from './TopRightButtons';
import SettingsPanel from './SettingsPanel';
import Logo from './Logo';

interface PageProps {
  variant?: 'centered' | 'flow';
  topRight?: boolean;
  logo?: boolean;
  compactLogo?: boolean;
  background?: string;
  padding?: string;
  className?: string;
  children: ReactNode;
}

export default function Page({
  variant = 'centered',
  topRight = true,
  logo = false,
  compactLogo = false,
  background = 'bg-[var(--page-bg)]',
  padding = 'px-4 py-10',
  className = '',
  children,
}: PageProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const layout =
    variant === 'centered'
      ? 'flex flex-col items-center justify-center'
      : 'flex flex-col items-center';

  return (
    <div className={`min-h-screen ${background} ${layout} relative ${padding} ${className}`}>
      {topRight && <TopRightButtons onSettings={() => setSettingsOpen((open) => !open)} />}
      {topRight && <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />}
      {logo && <Logo compact={compactLogo} />}
      {children}
    </div>
  );
}