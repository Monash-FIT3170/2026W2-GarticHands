import type { ReactNode } from 'react';
import TopRightButtons from './TopRightButtons';
import Logo from './Logo';

interface PageProps {
  /**
   * Page variant.
   * - `centered`: vertically + horizontally centers a single content card (landing, lobby).
   * - `flow`: top-aligned content for screens that scroll or stretch (input, draw, guess).
   */
  variant?: 'centered' | 'flow';
  /** Show top-right utility buttons. Default: true. */
  topRight?: boolean;
  /** Show the GarticHand logo at the top. Default: false. */
  logo?: boolean;
  /** Compact logo (scale-90, negative bottom margin). Use when stacking with a lobby card. */
  compactLogo?: boolean;
  /** Background color class. Default: `bg-[#6FADA0]` (brand teal). */
  background?: string;
  /** Padding utility classes. Default: `px-4 py-10`. */
  padding?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Page layout shell — provides the brand background, optional logo, and the top-right
 * utility buttons. Pages stay declarative: `<Page logo><Card>…</Card></Page>`.
 */
export default function Page({
  variant = 'centered',
  topRight = true,
  logo = false,
  compactLogo = false,
  background = 'bg-[#6FADA0]',
  padding = 'px-4 py-10',
  className = '',
  children,
}: PageProps) {
  const layout =
    variant === 'centered'
      ? 'flex flex-col items-center justify-center'
      : 'flex flex-col items-center';

  return (
    <div className={`min-h-screen ${background} ${layout} relative ${padding} ${className}`}>
      {topRight && <TopRightButtons />}
      {logo && <Logo compact={compactLogo} />}
      {children}
    </div>
  );
}
