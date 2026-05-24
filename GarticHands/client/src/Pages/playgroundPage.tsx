import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DrawingProvider,
  DrawingCameraInput,
  DrawingCameraCanvas,
  useDrawing,
} from '../drawing'
import { Card, Button } from '../components/ui'

type DrawMode = 'split' | 'overlay' | 'both'

const MODES: Array<{ id: DrawMode; label: string }> = [
  { id: 'split', label: 'Camera + Canvas' },
  { id: 'overlay', label: 'Draw on Camera' },
  { id: 'both', label: 'Camera + Overlay + Canvas' },
]

/**
 * Free-form sandbox — load MediaPipe, see your hand tracking, draw anything you
 * want, switch layouts. No timer, no networking, no submission. Useful for
 * testing the camera setup and experimenting with gestures before joining a game.
 */
export default function PlaygroundPage() {
  return (
    <DrawingProvider>
      <PlaygroundInner />
    </DrawingProvider>
  )
}

function PlaygroundInner() {
  const navigate = useNavigate()
  const { getDrawingImage } = useDrawing()
  const [mode, setMode] = useState<DrawMode>('split')
  const [snapshot, setSnapshot] = useState<string | null>(null)

  function handleSnapshot() {
    const url = getDrawingImage()
    setSnapshot(url)
  }

  return (
    <div className="background !justify-start">
      <Card variant="glass" className="w-full !max-w-5xl">
        <div className="flex items-start justify-between mb-3 gap-4">
          <div>
            <p className="rounds">Playground</p>
            <h1 className="text-3xl">MediaPipe Sandbox</h1>
            <p className="text-sm text-white/80 mt-1">
              No timer, no network — try every layout and gesture.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
            Home
          </Button>
        </div>

        <div className="mt-2 mb-2 inline-flex rounded-full bg-white/80 p-1 gap-1">
          {MODES.map((m) => {
            const selected = mode === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                  selected
                    ? 'bg-[#2E5534] text-white shadow-sm'
                    : 'text-[#3D6B64] hover:bg-white'
                }`}
              >
                {m.label}
              </button>
            )
          })}
        </div>

        {mode === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <Panel label="Camera">
              <DrawingCameraInput />
            </Panel>
            <Panel label="Canvas">
              <DrawingCameraCanvas strokeColor="black" />
            </Panel>
          </div>
        )}

        {mode === 'overlay' && (
          <Panel label="Camera + Canvas">
            <div className="relative">
              <DrawingCameraInput />
              <DrawingCameraCanvas
                strokeColor="white"
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </Panel>
        )}

        {mode === 'both' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <Panel label="Camera + Overlay">
              <div className="relative">
                <DrawingCameraInput />
                <DrawingCameraCanvas
                  strokeColor="white"
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </Panel>
            <Panel label="Canvas">
              <DrawingCameraCanvas strokeColor="black" />
            </Panel>
          </div>
        )}

        <p className="text-xs text-white/70 mt-4 text-center">
          Pinch your index finger and thumb to draw &middot; Open palm to erase
        </p>

        <div className="flex items-end justify-end mt-4 gap-3">
          <Button variant="outline" size="sm" onClick={handleSnapshot}>
            Snapshot
          </Button>
        </div>

        {snapshot && (
          <div className="mt-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/80 mb-2">
              Last Snapshot
            </p>
            <img
              src={snapshot}
              alt="Snapshot of your drawing"
              className="w-full max-w-md bg-white rounded-lg border border-white/30"
            />
          </div>
        )}
      </Card>
    </div>
  )
}

interface PanelProps {
  label: string
  children: React.ReactNode
}

function Panel({ label, children }: PanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/80">
        {label}
      </p>
      {children}
    </div>
  )
}
