import { useState, type ReactNode } from 'react';
import TopRightButtons from './TopRightButtons';
import SettingsPanel from './SettingsPanel';
import RulesPanel from './RulesPanel';
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
  const [rulesOpen, setRulesOpen] = useState(false);

  const layout =
    variant === 'centered'
      ? 'flex flex-col items-center justify-center'
      : 'flex flex-col items-center';

  return (
    <div
      className={`min-h-screen ${background} ${layout} relative ${padding} ${className}`}
      style={{ background: 'var(--page-gradient)' }}
    >
      {/* Decorative background rays */}
      <div className="background-rays">
        <div className="background-ray background-ray-top-1" />
        <div className="background-ray background-ray-top-2" />
        <div className="background-ray background-ray-top-3" />
        <div className="background-ray background-ray-top-4" />

        <div className="background-ray background-ray-bottom-1" />
        <div className="background-ray background-ray-bottom-2" />
        <div className="background-ray background-ray-bottom-3" />
        <div className="background-ray background-ray-bottom-4" />
      </div>

      {topRight && (
        <TopRightButtons
          onSettings={() => setSettingsOpen((open) => !open)}
          onRules={() => setRulesOpen(true)}
        />
      )}

      {topRight && (
        <SettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      <RulesPanel
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
      />

      {logo && <Logo compact={compactLogo} />}

      {children}
    </div>
  );
}