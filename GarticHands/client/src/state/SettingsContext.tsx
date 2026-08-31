import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

/** Colour-vision variants the UI can render. `default` is the stock brand palette. */
export type ColorVisionMode = 'default' | 'deuteranopia' | 'protanopia' | 'tritanopia';

/** All selectable modes, in the order the settings panel lists them. */
export const COLOR_VISION_MODES: readonly ColorVisionMode[] = [
  'default',
  'deuteranopia',
  'protanopia',
  'tritanopia',
];

const STORAGE_KEY = 'gartichands.colorVision';

function isColorVisionMode(value: unknown): value is ColorVisionMode {
  return typeof value === 'string' && (COLOR_VISION_MODES as readonly string[]).includes(value);
}

/** Reads the persisted mode; falls back to `default` on garbage or unavailable storage. */
function readStoredMode(): ColorVisionMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isColorVisionMode(stored) ? stored : 'default';
  } catch {
    return 'default';
  }
}

interface SettingsContextValue {
  /** Currently active colour-vision mode. */
  colorVision: ColorVisionMode;
  /** Switches the palette, persists the choice, and re-tags `<html>`. */
  setColorVision: (mode: ColorVisionMode) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * Holds user-facing UI settings (currently just the colour-vision mode). Lives at
 * the app root (mounted in `GarticHands.tsx`) so every page shares one palette.
 *
 * The active mode is mirrored onto `<html data-color-vision="…">`, which the
 * attribute-scoped palette overrides in `index.css` key off. In `default` mode the
 * attribute is removed entirely, so the DOM — and every rendered pixel — is
 * identical to the unthemed app.
 *
 * Persisted to localStorage so the choice survives reloads.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [colorVision, setColorVisionState] = useState<ColorVisionMode>(readStoredMode);

  // Idempotent on purpose — StrictMode double-invokes effects.
  useEffect(() => {
    const root = document.documentElement;
    if (colorVision === 'default') {
      root.removeAttribute('data-color-vision');
    } else {
      root.setAttribute('data-color-vision', colorVision);
    }
    try {
      if (colorVision === 'default') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, colorVision);
      }
    } catch {
      // Storage unavailable (e.g. blocked third-party context) — the mode still
      // applies for this session, it just won't survive a reload.
    }
  }, [colorVision]);

  const setColorVision = useCallback((mode: ColorVisionMode) => {
    setColorVisionState(mode);
  }, []);

  return (
    <SettingsContext.Provider value={{ colorVision, setColorVision }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be called inside <SettingsProvider>.');
  }
  return ctx;
}
