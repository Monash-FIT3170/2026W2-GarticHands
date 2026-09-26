import { useEffect, useState, type ReactNode } from 'react';
import DrawingCameraInput from './components/DrawingCameraInput';
import DrawingCameraCanvas from './components/DrawingCameraCanvas';
import type { DrawingTool } from './components/Canvas';

export type DrawMode = 'split' | 'overlay' | 'both';

export interface DrawModeOption {
  id: DrawMode;
  label: string;
  description: string;
}

export const DRAW_MODES: readonly DrawModeOption[] = [
  { id: 'split', label: 'Camera + Canvas', description: 'Camera and canvas side-by-side.' },
  { id: 'overlay', label: 'Draw on Camera', description: 'Strokes appear directly on the camera feed.' },
  { id: 'both', label: 'Camera + Overlay + Canvas', description: 'Canvas alongside, plus strokes on the camera.' },
];

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
const ERASER_SIZE_OPTIONS = [8, 12, 18, 24] as const;

export type DrawingColour = string;
export type DrawingThickness = (typeof THICKNESS_OPTIONS)[number];
export type EraserSize = (typeof ERASER_SIZE_OPTIONS)[number];

interface DrawingSettings {
  colour: DrawingColour;
  thickness: DrawingThickness;
}

interface DrawingSettingsPickerProps {
  settings: DrawingSettings;
  eraserSize: EraserSize;
  tool: DrawingTool;
  onSettingsChange: (settings: DrawingSettings) => void;
  onEraserSizeChange: (size: EraserSize) => void;
  disabled?: boolean;
}

function DrawingSettingsPicker({
  settings,
  eraserSize,
  tool,
  onSettingsChange,
  onEraserSizeChange,
  disabled = false,
}: DrawingSettingsPickerProps) {
  return (
    <div
      className={`mt-3 flex flex-wrap items-end gap-6 ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {tool === 'draw' ? (
        <>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Colour
            </p>

            <div className="flex items-center gap-2">
              {PRESET_COLOURS.map((colour) => {
                const selected =
                  settings.colour.toLowerCase() === colour.toLowerCase();

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
                className="relative flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[var(--text-muted)] transition-transform hover:scale-110"
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
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Eraser Size
          </p>

          <div className="flex items-center gap-3">
            {ERASER_SIZE_OPTIONS.map((size) => {
              const selected = eraserSize === size;

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onEraserSizeChange(size)}
                  aria-label={`Select eraser size ${size} pixels`}
                  title={`${size}px`}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                    selected
                      ? 'bg-[var(--primary)]'
                      : 'bg-[var(--surface)] hover:bg-black/5'
                  }`}
                >
                  <span
                    className="rounded-full bg-[var(--text-primary)]"
                    style={{
                      width: `${Math.min(size, 18)}px`,
                      height: `${Math.min(size, 18)}px`,
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface DrawingToolPickerProps {
  tool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  disabled?: boolean;
}

function DrawingToolPicker({
  tool,
  onToolChange,
  disabled = false,
}: DrawingToolPickerProps) {
  return (
    <div
      className={`inline-flex rounded-full bg-[var(--surface)] p-1 gap-1 ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => onToolChange('draw')}
        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
          tool === 'draw'
            ? 'bg-[var(--primary)] text-white shadow-sm'
            : 'text-[var(--text-primary)] hover:bg-black/5'
        }`}
        aria-pressed={tool === 'draw'}
      >
        ✎ Drawing
      </button>

      <button
        type="button"
        onClick={() => onToolChange('erase')}
        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
          tool === 'erase'
            ? 'bg-[var(--primary)] text-white shadow-sm'
            : 'text-[var(--text-primary)] hover:bg-black/5'
        }`}
        aria-pressed={tool === 'erase'}
      >
        Eraser
      </button>
    </div>
  );
}

const MODE_STORAGE_KEY = 'gartichands:drawMode';
const VALID_MODES = new Set<DrawMode>(['split', 'overlay', 'both']);

function loadModePreference(fallback: DrawMode): DrawMode {
  try {
    const v = localStorage.getItem(MODE_STORAGE_KEY);
    if (v && VALID_MODES.has(v as DrawMode)) return v as DrawMode;
  } catch {}
  return fallback;
}

function saveModePreference(mode: DrawMode) {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {}
}

export function useDrawingMode(initial: DrawMode = 'split') {
  const [mode, setMode] = useState<DrawMode>(() => loadModePreference(initial));

  useEffect(() => {
    saveModePreference(mode);
  }, [mode]);

  return [mode, setMode] as const;
}

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

interface DrawingStageProps {
  mode: DrawMode;
  drawingEnabled?: boolean;
}

export function DrawingStage({
  mode,
  drawingEnabled = true,
}: DrawingStageProps) {
  const [tool, setTool] = useState<DrawingTool>('draw');

  const [settings, setSettings] = useState<DrawingSettings>({
    colour: '#000000',
    thickness: 4,
  });

  const [eraserSize, setEraserSize] = useState<EraserSize>(18);

  return (
    <div>
      <DrawingToolPicker
        tool={tool}
        onToolChange={setTool}
        disabled={!drawingEnabled}
      />

      <DrawingSettingsPicker
        settings={settings}
        eraserSize={eraserSize}
        tool={tool}
        onSettingsChange={setSettings}
        onEraserSizeChange={setEraserSize}
        disabled={!drawingEnabled}
      />

      <div className="mt-2">
        {mode === 'split' && (
          <SplitLayout
            drawingEnabled={drawingEnabled}
            settings={settings}
            tool={tool}
            eraserSize={eraserSize}
          />
        )}

        {mode === 'overlay' && (
          <OverlayLayout
            drawingEnabled={drawingEnabled}
            settings={settings}
            tool={tool}
            eraserSize={eraserSize}
          />
        )}

        {mode === 'both' && (
          <BothLayout
            drawingEnabled={drawingEnabled}
            settings={settings}
            tool={tool}
            eraserSize={eraserSize}
          />
        )}
      </div>
    </div>
  );
}

interface DrawingLayoutProps {
  drawingEnabled: boolean;
  settings: DrawingSettings;
  tool: DrawingTool;
  eraserSize: EraserSize;
}

function SplitLayout({
  drawingEnabled,
  settings,
  tool,
  eraserSize,
}: DrawingLayoutProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      <Panel label="Camera">
        <DrawingCameraInput enabled={drawingEnabled} />
      </Panel>

      <Panel label="Canvas">
        <DrawingCameraCanvas
          strokeColor={settings.colour}
          strokeWidth={settings.thickness}
          tool={tool}
          eraserSize={eraserSize}
        />
      </Panel>
    </div>
  );
}

function OverlayLayout({
  drawingEnabled,
  settings,
  tool,
  eraserSize,
}: DrawingLayoutProps) {
  return (
    <Panel label="Camera + Canvas">
      <div className="relative">
        <DrawingCameraInput enabled={drawingEnabled} />

        <DrawingCameraCanvas
          strokeColor={settings.colour}
          strokeWidth={settings.thickness}
          tool={tool}
          eraserSize={eraserSize}
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        />

        <DrawingCameraCanvas
          strokeColor={settings.colour}
          strokeWidth={settings.thickness}
          tool={tool}
          eraserSize={eraserSize}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </Panel>
  );
}

function BothLayout({
  drawingEnabled,
  settings,
  tool,
  eraserSize,
}: DrawingLayoutProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      <Panel label="Camera + Overlay">
        <div className="relative">
          <DrawingCameraInput enabled={drawingEnabled} />

          <DrawingCameraCanvas
            strokeColor={settings.colour}
            strokeWidth={settings.thickness}
            tool={tool}
            eraserSize={eraserSize}
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </Panel>

      <Panel label="Canvas">
        <DrawingCameraCanvas
          strokeColor={settings.colour}
          strokeWidth={settings.thickness}
          tool={tool}
          eraserSize={eraserSize}
        />
      </Panel>
    </div>
  );
}