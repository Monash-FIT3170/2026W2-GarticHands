import { useEffect, useState, type ReactNode } from 'react';
import DrawingCameraInput from './components/DrawingCameraInput';
import DrawingCameraCanvas from './components/DrawingCameraCanvas';

/**
 * Drawing-layout primitives shared by `/draw`, `/playground`, and `/solo`.
 *
 * The three pages all need the same three things:
 *   1. A `DrawMode` state with localStorage persistence — `useDrawingMode()`
 *   2. A segmented mode picker — `<DrawingModePicker>`
 *   3. The actual camera/canvas layout for the chosen mode — `<DrawingStage>`
 *
 * Pages compose them; layout HTML/Tailwind is owned here so any visual tweak
 * lands in one place.
 */

export type DrawMode = 'split' | 'overlay' | 'both';

export interface DrawModeOption {
  id: DrawMode;
  label: string;
  description: string;
}

export const DRAW_MODES: readonly DrawModeOption[] = [
  {
    id: 'split',
    label: 'Camera + Canvas',
    description: 'Camera and canvas side-by-side.',
  },
  {
    id: 'overlay',
    label: 'Draw on Camera',
    description: 'Strokes appear directly on the camera feed.',
  },
  {
    id: 'both',
    label: 'Camera + Overlay + Canvas',
    description: 'Canvas alongside, plus strokes on the camera.',
  },
] as const;

// ---------------------------------------------------------------------------
// Drawing settings
// ---------------------------------------------------------------------------

const PRESET_COLOURS = [
  '#000000',
  '#E53935',
  '#F57C00',
  '#FBC02D',
  '#43A047',
  '#1E88E5',
  '#8E24AA',
] as const;

const THICKNESS_OPTIONS = [2, 4, 8, 12] as const;

export type DrawingColour = string;
export type DrawingThickness = (typeof THICKNESS_OPTIONS)[number];

interface DrawingSettings {
  colour: DrawingColour;
  thickness: DrawingThickness;
}

interface DrawingSettingsPickerProps {
  settings: DrawingSettings;
  onSettingsChange: (settings: DrawingSettings) => void;
  disabled?: boolean;
}

function DrawingSettingsPicker({
  settings,
  onSettingsChange,
  disabled = false,
}: DrawingSettingsPickerProps) {
  return (
    <div
      className={`mt-3 flex flex-wrap items-end gap-6 ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Colour picker */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Colour
        </p>

        <div className="flex items-center gap-2">
          {PRESET_COLOURS.map((colour) => {
            const selected = settings.colour.toLowerCase() === colour.toLowerCase();

            return (
              <button
                key={colour}
                type="button"
                onClick={() =>
                  onSettingsChange({
                    ...settings,
                    colour,
                  })
                }
                aria-label={`Select colour ${colour}`}
                title={colour}
                className={`h-7 w-7 rounded-full border-2 transition-transform ${
                  selected
                    ? 'scale-110 border-[var(--text-primary)]'
                    : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: colour }}
              />
            );
          })}

          <label
            className={`relative flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[var(--text-muted)] transition-transform hover:scale-110`}
            title="Choose custom colour"
          >
            <span className="text-lg font-bold leading-none text-[var(--text-primary)]">
              +
            </span>

            <input
              type="color"
              value={settings.colour}
              onChange={(event) =>
                onSettingsChange({
                  ...settings,
                  colour: event.target.value,
                })
              }
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Choose custom colour"
            />
          </label>
        </div>
      </div>

      {/* Thickness picker */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Thickness
        </p>

        <div className="flex items-center gap-3">
          {THICKNESS_OPTIONS.map((thickness) => {
            const selected = settings.thickness === thickness;

            return (
              <button
                key={thickness}
                type="button"
                onClick={() =>
                  onSettingsChange({
                    ...settings,
                    thickness,
                  })
                }
                aria-label={`Select thickness ${thickness} pixels`}
                title={`${thickness}px`}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                  selected
                    ? 'bg-[var(--primary)]'
                    : 'bg-[var(--surface)] hover:bg-black/5'
                }`}
              >
                <span
                  className="rounded-full bg-[var(--text-primary)]"
                  style={{
                    width: `${Math.min(thickness + 2, 14)}px`,
                    height: `${Math.min(thickness + 2, 14)}px`,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// useDrawingMode — state + localStorage persistence
// ---------------------------------------------------------------------------

const MODE_STORAGE_KEY = 'gartichands:drawMode';
const VALID_MODES = new Set<DrawMode>(['split', 'overlay', 'both']);

function loadModePreference(fallback: DrawMode): DrawMode {
  try {
    const v = localStorage.getItem(MODE_STORAGE_KEY);
    if (v && VALID_MODES.has(v as DrawMode)) return v as DrawMode;
  } catch {
    /* localStorage may be unavailable — ignore. */
  }
  return fallback;
}

function saveModePreference(mode: DrawMode) {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

/** State + persisted preference for the active draw mode. */
export function useDrawingMode(initial: DrawMode = 'split') {
  const [mode, setMode] = useState<DrawMode>(() => loadModePreference(initial));

  useEffect(() => {
    saveModePreference(mode);
  }, [mode]);

  return [mode, setMode] as const;
}

// ---------------------------------------------------------------------------
// DrawingModePicker — segmented control
// ---------------------------------------------------------------------------

interface DrawingModePickerProps {
  mode: DrawMode;
  onModeChange: (mode: DrawMode) => void;
  disabled?: boolean;
  className?: string;
}

export function DrawingModePicker({
  mode,
  onModeChange,
  disabled,
  className = '',
}: DrawingModePickerProps) {
  return (
    <div className={`mt-2 mb-2 ${className}`}>
      <div
        className={`inline-flex rounded-full bg-[var(--surface)] p-1 gap-1 ${
          disabled ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        {DRAW_MODES.map((m) => {
          const selected = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onModeChange(m.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                selected
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--text-primary)] hover:bg-black/5'
              }`}
              title={m.description}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel — caption + rounded surface
// ---------------------------------------------------------------------------

interface PanelProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function Panel({ label, children, className = '' }: PanelProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--text-muted)]">
        {label}
      </p>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DrawingStage — renders the right camera/canvas arrangement for `mode`
// ---------------------------------------------------------------------------

interface DrawingStageProps {
  mode: DrawMode;
  drawingEnabled?: boolean;
}

/**
 * Renders the camera + canvas layout for the chosen mode. Must be wrapped in
 * a `<DrawingProvider>` (pages typically do that once at the top).
 *
 * Layouts:
 *  - `split`:   Camera | Canvas — black strokes on white
 *  - `overlay`: Camera with strokes drawn directly on top — white strokes
 *  - `both`:    Camera-with-overlay | Canvas — primary canvas (mounted first)
 *               is the white-background black-strokes one that gets submitted.
 */
export function DrawingStage({
  mode,
  drawingEnabled = true,
}: DrawingStageProps) {
  const [settings, setSettings] = useState<DrawingSettings>({
    colour: '#000000',
    thickness: 4,
  });

  return (
    <div>
      <DrawingSettingsPicker
        settings={settings}
        onSettingsChange={setSettings}
        disabled={!drawingEnabled}
      />

      <div className="mt-2">
        {mode === 'split' && (
          <SplitLayout
            drawingEnabled={drawingEnabled}
            settings={settings}
          />
        )}

        {mode === 'overlay' && (
          <OverlayLayout
            drawingEnabled={drawingEnabled}
            settings={settings}
          />
        )}

        {mode === 'both' && (
          <BothLayout
            drawingEnabled={drawingEnabled}
            settings={settings}
          />
        )}
      </div>
    </div>
  );
}

interface DrawingLayoutProps {
  drawingEnabled: boolean;
  settings: DrawingSettings;
}

function SplitLayout({ drawingEnabled, settings }: DrawingLayoutProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      <Panel label="Camera">
        <DrawingCameraInput enabled={drawingEnabled} />
      </Panel>
      <Panel label="Canvas">
        <DrawingCameraCanvas
          strokeColor={settings.colour}
          strokeWidth={settings.thickness}
        />
      </Panel>
    </div>
  );
}

function OverlayLayout({ drawingEnabled, settings }: DrawingLayoutProps) {
  return (
    <Panel label="Camera + Canvas">
      <div className="relative">
        <DrawingCameraInput enabled={drawingEnabled} />

        {/*
          Hidden primary canvas — mounted FIRST so it's the one submitted via
          `getDrawingImage()`.
        */}
        <DrawingCameraCanvas
          strokeColor={settings.colour}
          strokeWidth={settings.thickness}
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        />

        {/* Visible overlay — uses the same selected colour and thickness. */}
        <DrawingCameraCanvas
          strokeColor={settings.colour}
          strokeWidth={settings.thickness}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </Panel>
  );
}

function BothLayout({ drawingEnabled, settings }: DrawingLayoutProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      <Panel label="Camera + Overlay">
        <div className="relative">
          <DrawingCameraInput enabled={drawingEnabled} />

          <DrawingCameraCanvas
            strokeColor={settings.colour}
            strokeWidth={settings.thickness}
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </Panel>

      <Panel label="Canvas">
        <DrawingCameraCanvas
          strokeColor={settings.colour}
          strokeWidth={settings.thickness}
        />
      </Panel>
    </div>
  );
}