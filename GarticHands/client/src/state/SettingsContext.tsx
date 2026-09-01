import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
// Dependency-free leaf module — imported directly (not via `../drawing`) so
// settings consumers don't drag the whole drawing bundle (MediaPipe, canvas
// components) into their module graph.
import {
  DEFAULT_GESTURE_SENSITIVITY,
  DEFAULT_STROKE_SMOOTHING,
  GESTURE_SENSITIVITIES,
  STROKE_SMOOTHING_LEVELS,
  type GestureSensitivity,
  type StrokeSmoothing,
} from '../drawing/DrawingSettings';

// Re-exported so UI code (SettingsPanel) keeps a single import site for
// settings vocabulary, mirroring COLOR_VISION_MODES below.
export { GESTURE_SENSITIVITIES, STROKE_SMOOTHING_LEVELS };
export type { GestureSensitivity, StrokeSmoothing };

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
const SENSITIVITY_STORAGE_KEY = 'gartichands.gestureSensitivity';
const SMOOTHING_STORAGE_KEY = 'gartichands.strokeSmoothing';

function isColorVisionMode(value: unknown): value is ColorVisionMode {
  return typeof value === 'string' && (COLOR_VISION_MODES as readonly string[]).includes(value);
}

function isGestureSensitivity(value: unknown): value is GestureSensitivity {
  return typeof value === 'string' && (GESTURE_SENSITIVITIES as readonly string[]).includes(value);
}

function isStrokeSmoothing(value: unknown): value is StrokeSmoothing {
  return (
    typeof value === 'string' && (STROKE_SMOOTHING_LEVELS as readonly string[]).includes(value)
  );
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

/** Reads the persisted sensitivity; falls back to `default` on garbage or unavailable storage. */
function readStoredSensitivity(): GestureSensitivity {
  try {
    const stored = localStorage.getItem(SENSITIVITY_STORAGE_KEY);
    return isGestureSensitivity(stored) ? stored : DEFAULT_GESTURE_SENSITIVITY;
  } catch {
    return DEFAULT_GESTURE_SENSITIVITY;
  }
}

/** Reads the persisted smoothing level; falls back to `default` on garbage or unavailable storage. */
function readStoredSmoothing(): StrokeSmoothing {
  try {
    const stored = localStorage.getItem(SMOOTHING_STORAGE_KEY);
    return isStrokeSmoothing(stored) ? stored : DEFAULT_STROKE_SMOOTHING;
  } catch {
    return DEFAULT_STROKE_SMOOTHING;
  }
}

interface SettingsContextValue {
  /** Currently active colour-vision mode. */
  colorVision: ColorVisionMode;
  /** Switches the palette, persists the choice, and re-tags `<html>`. */
  setColorVision: (mode: ColorVisionMode) => void;
  /** Currently active gesture-trigger sensitivity. */
  gestureSensitivity: GestureSensitivity;
  /** Switches the sensitivity and persists the choice. */
  setGestureSensitivity: (level: GestureSensitivity) => void;
  /** Currently active stroke-smoothing level. */
  strokeSmoothing: StrokeSmoothing;
  /** Switches the smoothing level and persists the choice. */
  setStrokeSmoothing: (level: StrokeSmoothing) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * Holds user-facing UI settings — the colour-vision mode plus the drawing
 * adjustments (gesture sensitivity, stroke smoothing). Lives at the app root
 * (mounted in `GarticHands.tsx`) so every page shares one configuration.
 *
 * The active colour mode is mirrored onto `<html data-color-vision="…">`, which
 * the attribute-scoped palette overrides in `index.css` key off. In `default`
 * mode the attribute is removed entirely, so the DOM — and every rendered pixel
 * — is identical to the unthemed app.
 *
 * The drawing adjustments have no DOM footprint of their own: pages read them
 * here and pass them into `<DrawingProvider>` (the drawing module is
 * self-contained and never reads app state directly).
 *
 * All settings persist to localStorage so choices survive reloads. Each key is
 * removed (not written) at its default level, keeping default-state storage
 * empty.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [colorVision, setColorVisionState] = useState<ColorVisionMode>(readStoredMode);
  const [gestureSensitivity, setGestureSensitivityState] =
    useState<GestureSensitivity>(readStoredSensitivity);
  const [strokeSmoothing, setStrokeSmoothingState] = useState<StrokeSmoothing>(readStoredSmoothing);

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

  useEffect(() => {
    try {
      if (gestureSensitivity === DEFAULT_GESTURE_SENSITIVITY) {
        localStorage.removeItem(SENSITIVITY_STORAGE_KEY);
      } else {
        localStorage.setItem(SENSITIVITY_STORAGE_KEY, gestureSensitivity);
      }
    } catch {
      // Storage unavailable — the setting still applies for this session.
    }
  }, [gestureSensitivity]);

  useEffect(() => {
    try {
      if (strokeSmoothing === DEFAULT_STROKE_SMOOTHING) {
        localStorage.removeItem(SMOOTHING_STORAGE_KEY);
      } else {
        localStorage.setItem(SMOOTHING_STORAGE_KEY, strokeSmoothing);
      }
    } catch {
      // Storage unavailable — the setting still applies for this session.
    }
  }, [strokeSmoothing]);

  const setColorVision = useCallback((mode: ColorVisionMode) => {
    setColorVisionState(mode);
  }, []);

  const setGestureSensitivity = useCallback((level: GestureSensitivity) => {
    setGestureSensitivityState(level);
  }, []);

  const setStrokeSmoothing = useCallback((level: StrokeSmoothing) => {
    setStrokeSmoothingState(level);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        colorVision,
        setColorVision,
        gestureSensitivity,
        setGestureSensitivity,
        strokeSmoothing,
        setStrokeSmoothing,
      }}
    >
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
