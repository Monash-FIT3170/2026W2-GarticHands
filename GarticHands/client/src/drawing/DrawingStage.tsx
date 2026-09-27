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
];

const PRESET_COLOURS = [
  '#000000',
  '#E53935',
  '#F57C00',
  '#FBC02D',
  '#43A047',
  '#1E88E5',
  '#8E24AA',
  '#EC4899',
  '#FFFFFF',
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

interface DrawingColourPickerProps {
  settings: DrawingSettings;
  onSettingsChange: (settings: DrawingSettings) => void;
  disabled: boolean;
  inactive: boolean;
  gameStyle: boolean;
}

function DrawingColourPicker({
  settings,
  onSettingsChange,
  disabled,
  inactive,
  gameStyle,
}: DrawingColourPickerProps) {
  return (
    <div
      className={`flex ${gameStyle ? 'items-center' : 'flex-col'} gap-4 ${
        inactive ? 'pointer-events-none opacity-40' : ''
      }`}
    >
      {!gameStyle && (
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Colour
        </p>
      )}

      <div className={`flex items-center ${gameStyle ? 'gap-1' : 'gap-2'}`}>
        {PRESET_COLOURS.map((colour) => {
          const selected = settings.colour.toLowerCase() === colour.toLowerCase();

          return (
            <button
              key={colour}
              type="button"
              onClick={() => onSettingsChange({ ...settings, colour })}
              aria-label={`Select colour ${colour}`}
              title={colour}
              disabled={disabled || inactive}
              className={`${gameStyle ? 'h-7 w-7 rounded-lg border-2' : 'h-7 w-7 rounded-full border-2'} transition-transform ${
                selected
                  ? `${gameStyle ? 'scale-110 border-white' : 'scale-110 border-[var(--text-primary)]'}`
                  : `${gameStyle ? 'border-transparent' : 'border-transparent hover:scale-110'}`
              }`}
              style={{ backgroundColor: colour }}
            />
          );
        })}

        <label
          className={`relative block cursor-pointer overflow-hidden border-2 border-white ${gameStyle ? 'h-10 w-10 rounded-lg' : 'flex h-7 w-7 items-center justify-center rounded-full border-dashed border-[var(--text-muted)] transition-transform hover:scale-110'}`}
          title="Choose custom colour"
          style={{ backgroundColor: settings.colour }}
        >
          {!gameStyle && (
            <span className="text-lg font-bold leading-none text-[var(--text-primary)]">+</span>
          )}

          <input
            type="color"
            value={settings.colour}
            onChange={(event) => onSettingsChange({ ...settings, colour: event.target.value })}
            disabled={disabled || inactive}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Choose custom colour"
          />
        </label>
      </div>
    </div>
  );
}

interface DrawingSettingsPickerProps {
  settings: DrawingSettings;
  eraserSize: EraserSize;
  tool: DrawingTool;
  onSettingsChange: (settings: DrawingSettings) => void;
  onEraserSizeChange: (size: EraserSize) => void;
  disabled?: boolean;
  gameStyle?: boolean;
}

function DrawingSettingsPicker({
  settings,
  eraserSize,
  tool,
  onSettingsChange,
  onEraserSizeChange,
  disabled = false,
  gameStyle = false,
}: DrawingSettingsPickerProps) {
  return (
    <div
      className={`${gameStyle ? 'flex flex-wrap items-center gap-4 lg:flex-nowrap' : 'mt-3 flex flex-wrap items-end gap-6'} ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {tool === 'draw' ? (
        <>
          <DrawingColourPicker
            settings={settings}
            onSettingsChange={onSettingsChange}
            disabled={disabled}
            inactive={false}
            gameStyle={gameStyle}
          />

          <div className={`flex ${gameStyle ? 'order-1 items-center' : 'flex-col'} gap-2`}>
            {!gameStyle && (
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Thickness
              </p>
            )}

            <div className={`flex items-center ${gameStyle ? 'gap-2' : 'gap-3'}`}>
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
                    aria-pressed={selected}
                    title={`${thickness}px`}
                    className={`flex ${gameStyle ? 'h-9 w-9 rounded-xl border-2' : 'h-8 w-8 rounded-full'} items-center justify-center transition-all ${
                      selected
                        ? `${gameStyle ? 'border-transparent bg-[var(--success)]' : 'bg-[var(--primary)]'}`
                        : `${gameStyle ? 'border-[var(--action)] bg-white' : 'bg-[var(--surface)] hover:bg-black/5'}`
                    }`}
                  >
                    <span
                      className={`rounded-full ${gameStyle ? (selected ? 'bg-white' : 'bg-[var(--action)]') : 'bg-[var(--text-primary)]'}`}
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
        <>
          <DrawingColourPicker
            settings={settings}
            onSettingsChange={onSettingsChange}
            disabled={disabled}
            inactive
            gameStyle={gameStyle}
          />

          <div className={`flex ${gameStyle ? 'items-center' : 'flex-col'} gap-2`}>
            {!gameStyle && (
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Eraser Size
              </p>
            )}

            <div className={`flex items-center ${gameStyle ? 'gap-2' : 'gap-3'}`}>
              {ERASER_SIZE_OPTIONS.map((size) => {
                const selected = eraserSize === size;

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onEraserSizeChange(size)}
                    aria-label={`Select eraser size ${size} pixels`}
                    aria-pressed={selected}
                    title={`${size}px`}
                    className={`flex ${gameStyle ? 'h-10 w-10 rounded-xl border-2' : 'h-8 w-8 rounded-full'} items-center justify-center transition-all ${
                      selected
                        ? `${gameStyle ? 'border-transparent bg-[var(--success)]' : 'bg-[var(--primary)]'}`
                        : `${gameStyle ? 'border-[var(--action)] bg-white' : 'bg-[var(--surface)] hover:bg-black/5'}`
                    }`}
                  >
                    <span
                      className={`rounded-full ${gameStyle ? (selected ? 'bg-white' : 'bg-[var(--action)]') : 'bg-[var(--text-primary)]'}`}
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
        </>
      )}
    </div>
  );
}

interface DrawingToolPickerProps {
  tool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  disabled?: boolean;
  gameStyle?: boolean;
}

function DrawingToolPicker({
  tool,
  onToolChange,
  disabled = false,
  gameStyle = false,
}: DrawingToolPickerProps) {
  return (
    <div
      className={`${gameStyle ? 'inline-flex gap-2' : 'inline-flex rounded-full bg-[var(--surface)] p-1 gap-1'} ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => onToolChange('draw')}
        className={`${gameStyle ? 'flex h-10 w-10 items-center justify-center rounded-xl border-2 text-xl' : 'px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.12em]'} font-bold transition-colors ${
          tool === 'draw'
            ? `${gameStyle ? 'border-transparent bg-[var(--success)] text-white' : 'bg-[var(--primary)] text-white shadow-sm'}`
            : `${gameStyle ? 'border-[var(--action)] bg-white text-[var(--text-primary)]' : 'text-[var(--text-primary)] hover:bg-black/5'}`
        }`}
        aria-label={gameStyle ? 'Pencil tool' : undefined}
        aria-pressed={tool === 'draw'}
      >
        {gameStyle ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            fill="none"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              d="M26.5077 0H27.465C27.608 0.0526642 27.8014 0.0655397 27.9531 0.0955537C28.1445 0.133401 28.3297 0.177917 28.5161 0.236511C29.8036 0.650255 30.8703 1.56483 31.4758 2.77403C31.6644 3.14664 31.8022 3.54291 31.8853 3.95219C31.9206 4.12569 31.9505 4.40195 32 4.5565V5.46502C31.9281 5.67695 31.9152 5.94753 31.86 6.17356C31.6878 6.87941 31.3641 7.5393 30.9112 8.10734C30.6286 8.46409 30.2039 8.86533 29.8756 9.1938L28.2805 10.7891L22.9605 16.1105L14.5099 24.5636L11.726 27.3483C10.808 28.2667 9.98112 29.2347 8.80923 29.8275C8.1075 30.1823 7.59445 30.2734 6.84256 30.4445L5.37559 30.7787L1.10396 31.755C0.950052 31.7905 0.137099 31.9547 0.0772234 32H0V31.9077C0.0634834 31.818 0.244833 30.9187 0.284494 30.7472L1.30458 26.2994L1.60017 25.0075C1.74311 24.3808 1.83377 23.9148 2.11264 23.3211C2.69652 22.078 3.72161 21.2045 4.68062 20.2458L7.46372 17.4619L15.9908 8.93228L21.2703 3.65136L22.8625 2.0583C23.132 1.78844 23.5445 1.35268 23.833 1.12302C24.4097 0.655756 25.0827 0.321638 25.8034 0.144533C26.0002 0.0955538 26.3377 0.0661233 26.5077 0ZM5.31683 23.1528C6.16156 23.9616 7.02684 24.8541 7.8567 25.685L8.4953 26.3259C8.5735 26.4042 8.78444 26.6209 8.8662 26.6761L18.6969 16.8422L21.6884 13.8486L22.5892 12.9488C22.7036 12.8346 22.9583 12.5924 23.0486 12.4762C22.6586 12.087 19.5973 8.98959 19.5028 8.96358C19.2134 9.22864 18.9113 9.54352 18.6311 9.82398L17.2422 11.2133L12.9378 15.5196L7.94639 20.513L6.29388 22.1661C5.97247 22.4877 5.62561 22.8231 5.31683 23.1528ZM4.07803 25.45C3.99586 25.6633 3.86597 26.3072 3.80938 26.5559L3.32344 28.6756L5.33211 28.2184C5.74039 28.1245 6.16414 28.033 6.56959 27.932C5.93153 27.3089 5.30784 26.6659 4.67222 26.0403C4.58048 25.95 4.1397 25.4905 4.07803 25.45ZM26.8361 2.52111C25.9463 2.61884 25.5783 2.86631 24.9414 3.51039C24.7684 3.68545 24.5723 3.87142 24.4044 4.05247C24.7622 4.42386 25.147 4.79705 25.5136 5.163L27.5309 7.17763C27.6733 7.32009 27.81 7.45948 27.9609 7.59303C28.0872 7.42563 28.467 7.05109 28.6331 6.8998C30.3978 5.29095 29.2597 2.41208 26.8594 2.51795C26.8516 2.519 26.8439 2.52006 26.8361 2.52111ZM22.6289 5.83872C22.4883 5.96534 21.323 7.10387 21.3122 7.17994C21.3891 7.30117 21.8848 7.7802 22.0109 7.90609L23.5305 9.42306L24.3892 10.2801C24.4883 10.379 24.7414 10.6425 24.842 10.7124C25.0275 10.4682 26.1328 9.47286 26.1356 9.34705C26.0636 9.22694 22.6783 5.86183 22.6289 5.83872Z"
              fill={tool === 'draw' ? 'white' : '#FF3C00'}
            />
          </svg>
        ) : (
          '✏️ Drawing'
        )}
      </button>

      <button
        type="button"
        onClick={() => onToolChange('erase')}
        className={`${gameStyle ? 'flex h-10 w-10 items-center justify-center rounded-xl border-2 text-xl' : 'px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.12em]'} font-bold transition-colors ${
          tool === 'erase'
            ? `${gameStyle ? 'border-transparent bg-[var(--success)] text-white' : 'bg-[var(--primary)] text-white shadow-sm'}`
            : `${gameStyle ? 'border-[var(--action)] bg-white text-[var(--text-primary)]' : 'text-[var(--text-primary)] hover:bg-black/5'}`
        }`}
        aria-label={gameStyle ? 'Eraser tool' : undefined}
        aria-pressed={tool === 'erase'}
      >
        {gameStyle ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 31 32"
            fill="none"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              d="M20.2663 0.0177362C22.2859 -0.263412 24.872 2.87168 26.2005 4.19232C27.3461 5.39896 28.5544 6.58135 29.5812 7.89741C30.4475 9.0073 31.0419 10.3713 30.5623 11.8051C30.0602 13.3301 28.8498 14.4107 27.8373 15.5529C26.7248 16.8078 25.5706 17.9802 24.4117 19.185L21.2285 22.4931C20.6075 23.1391 19.9352 23.8716 19.2926 24.4795C19.0585 24.2172 18.8001 23.9572 18.5555 23.7038L10.9605 15.8094L8.53889 13.2901C8.15111 12.8869 7.59899 12.2757 7.19287 11.9195C7.23957 11.8524 7.28862 11.7871 7.33993 11.7237C7.66957 11.3163 8.25144 10.7453 8.62975 10.3526L10.9253 7.9698C12.5146 6.31699 14.078 4.63149 15.7328 3.05143C17.1162 1.73047 18.2666 0.20331 20.2663 0.0177362Z"
              fill={tool === 'erase' ? 'white' : '#FF3C00'}
            />
            <path
              d="M5.75348 14.1877C5.647 14.0773 5.44396 13.839 5.29257 13.8372C4.45949 14.6778 3.74675 15.4592 2.92593 16.3615C1.31487 18.1325 -0.940575 20.2228 0.416818 22.9134C1.21335 24.4923 2.72767 25.7998 3.88735 27.0973C5.45428 28.6647 7.30452 31.0012 9.3229 31.7748C9.86583 31.9832 10.6047 31.9931 11.163 31.9935L14.5893 29.3011C15.4958 28.4835 16.3189 27.6051 17.1626 26.7177C17.2617 26.6135 17.3793 26.5006 17.4718 26.392C17.0903 25.9222 16.4129 25.2625 15.9759 24.8086L13.2402 21.9649C10.7456 19.3715 8.25211 16.7769 5.75348 14.1877Z"
              fill={tool === 'erase' ? 'white' : '#FF3C00'}
            />
          </svg>
        ) : (
          '🧽 Eraser'
        )}
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
    <div className={`${className || 'mt-2 mb-2'}`}>
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
      {label && (
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

interface DrawingStageProps {
  mode: DrawMode;
  drawingEnabled?: boolean;
  tool?: DrawingTool;
  onToolChange?: (tool: DrawingTool) => void;
  presentation?: 'standard' | 'game';
  prompt?: string;
  toolbarActions?: ReactNode;
}

export function DrawingStage({
  mode,
  drawingEnabled = true,
  tool: controlledTool,
  onToolChange,
  presentation = 'standard',
  prompt,
  toolbarActions,
}: DrawingStageProps) {
  const [internalTool, setInternalTool] = useState<DrawingTool>('draw');
  const tool = controlledTool ?? internalTool;

  function handleToolChange(nextTool: DrawingTool) {
    setInternalTool(nextTool);
    onToolChange?.(nextTool);
  }

  const [settings, setSettings] = useState<DrawingSettings>({
    colour: '#000000',
    thickness: 4,
  });

  const [eraserSize, setEraserSize] = useState<EraserSize>(18);

  const media = (
    <div className={presentation === 'game' ? 'p-3 md:p-5' : 'mt-2'}>
      {mode === 'split' && (
        <SplitLayout
          drawingEnabled={drawingEnabled}
          settings={settings}
          tool={tool}
          eraserSize={eraserSize}
          showLabels={presentation !== 'game'}
        />
      )}

      {mode === 'overlay' && (
        <OverlayLayout
          drawingEnabled={drawingEnabled}
          settings={settings}
          tool={tool}
          eraserSize={eraserSize}
          showLabels={presentation !== 'game'}
        />
      )}

      {mode === 'both' && (
        <BothLayout
          drawingEnabled={drawingEnabled}
          settings={settings}
          tool={tool}
          eraserSize={eraserSize}
          showLabels={presentation !== 'game'}
        />
      )}
    </div>
  );

  if (presentation === 'game') {
    return (
      <div className="overflow-hidden rounded-2xl border-4 border-[var(--page-bg)] bg-[var(--card-bg)] shadow-md">
        <div className="bg-[var(--primary)] px-4 py-3 text-center text-xl font-extrabold text-white md:text-2xl">
          {prompt || 'Your prompt will appear here'}
        </div>
        {media}
        <div className="flex flex-wrap items-center justify-center gap-4 px-3 py-2 md:gap-4 md:px-4 lg:flex-nowrap">
          <DrawingToolPicker
            tool={tool}
            onToolChange={handleToolChange}
            disabled={!drawingEnabled}
            gameStyle
          />
          <span className="hidden h-10 w-px shrink-0 bg-white/70 md:block" />
          <DrawingSettingsPicker
            settings={settings}
            eraserSize={eraserSize}
            tool={tool}
            onSettingsChange={setSettings}
            onEraserSizeChange={setEraserSize}
            disabled={!drawingEnabled}
            gameStyle
          />
          {toolbarActions && <span className="hidden h-10 w-px shrink-0 bg-white/70 md:block" />}
          {toolbarActions}
        </div>
      </div>
    );
  }

  return (
    <div>
      <DrawingToolPicker tool={tool} onToolChange={handleToolChange} disabled={!drawingEnabled} />

      <DrawingSettingsPicker
        settings={settings}
        eraserSize={eraserSize}
        tool={tool}
        onSettingsChange={setSettings}
        onEraserSizeChange={setEraserSize}
        disabled={!drawingEnabled}
      />
      {media}
    </div>
  );
}

interface DrawingLayoutProps {
  drawingEnabled: boolean;
  settings: DrawingSettings;
  tool: DrawingTool;
  eraserSize: EraserSize;
  showLabels?: boolean;
}

function SplitLayout({
  drawingEnabled,
  settings,
  tool,
  eraserSize,
  showLabels = true,
}: DrawingLayoutProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      <Panel label={showLabels ? 'Camera' : ''}>
        <DrawingCameraInput enabled={drawingEnabled} />
      </Panel>

      <Panel label={showLabels ? 'Canvas' : ''}>
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
  showLabels = true,
}: DrawingLayoutProps) {
  return (
    <Panel label={showLabels ? 'Camera + Canvas' : ''}>
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
  showLabels = true,
}: DrawingLayoutProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      <Panel label={showLabels ? 'Camera + Overlay' : ''}>
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

      <Panel label={showLabels ? 'Canvas' : ''}>
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
