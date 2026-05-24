import { useEffect, useState, type ReactNode } from 'react'
import DrawingCameraInput from './components/DrawingCameraInput'
import DrawingCameraCanvas from './components/DrawingCameraCanvas'

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

export type DrawMode = 'split' | 'overlay' | 'both'

export interface DrawModeOption {
  id: DrawMode
  label: string
  description: string
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
] as const

// ---------------------------------------------------------------------------
// useDrawingMode — state + localStorage persistence
// ---------------------------------------------------------------------------

const MODE_STORAGE_KEY = 'gartichands:drawMode'
const VALID_MODES = new Set<DrawMode>(['split', 'overlay', 'both'])

function loadModePreference(fallback: DrawMode): DrawMode {
  try {
    const v = localStorage.getItem(MODE_STORAGE_KEY)
    if (v && VALID_MODES.has(v as DrawMode)) return v as DrawMode
  } catch {
    /* localStorage may be unavailable — ignore. */
  }
  return fallback
}

function saveModePreference(mode: DrawMode) {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode)
  } catch {
    /* ignore */
  }
}

/** State + persisted preference for the active draw mode. */
export function useDrawingMode(initial: DrawMode = 'split') {
  const [mode, setMode] = useState<DrawMode>(() => loadModePreference(initial))

  useEffect(() => {
    saveModePreference(mode)
  }, [mode])

  return [mode, setMode] as const
}

// ---------------------------------------------------------------------------
// DrawingModePicker — segmented control
// ---------------------------------------------------------------------------

interface DrawingModePickerProps {
  mode: DrawMode
  onModeChange: (mode: DrawMode) => void
  disabled?: boolean
  className?: string
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
        className={`inline-flex rounded-full bg-white/80 p-1 gap-1 ${
          disabled ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        {DRAW_MODES.map((m) => {
          const selected = mode === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onModeChange(m.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                selected
                  ? 'bg-[#2E5534] text-white shadow-sm'
                  : 'text-[#3D6B64] hover:bg-white'
              }`}
              title={m.description}
            >
              {m.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Panel — caption + rounded surface
// ---------------------------------------------------------------------------

interface PanelProps {
  label: string
  children: ReactNode
  className?: string
}

export function Panel({ label, children, className = '' }: PanelProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/80">
        {label}
      </p>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DrawingStage — renders the right camera/canvas arrangement for `mode`
// ---------------------------------------------------------------------------

interface DrawingStageProps {
  mode: DrawMode
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
export function DrawingStage({ mode }: DrawingStageProps) {
  switch (mode) {
    case 'split':
      return <SplitLayout />
    case 'overlay':
      return <OverlayLayout />
    case 'both':
      return <BothLayout />
  }
}

function SplitLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      <Panel label="Camera">
        <DrawingCameraInput />
      </Panel>
      <Panel label="Canvas">
        <DrawingCameraCanvas strokeColor="black" />
      </Panel>
    </div>
  )
}

function OverlayLayout() {
  return (
    <Panel label="Camera + Canvas">
      <div className="relative">
        <DrawingCameraInput />
        <DrawingCameraCanvas
          strokeColor="white"
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </Panel>
  )
}

function BothLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      <Panel label="Camera + Overlay">
        <div className="relative">
          <DrawingCameraInput />
          {/* Mounted second → shadow overlay, not submitted. */}
          <DrawingCameraCanvas
            strokeColor="white"
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </Panel>
      <Panel label="Canvas">
        {/* Mounted first → primary canvas, this is what gets submitted. */}
        <DrawingCameraCanvas strokeColor="black" />
      </Panel>
    </div>
  )
}
