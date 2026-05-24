import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DrawingProvider,
  DrawingCameraInput,
  DrawingCameraCanvas,
  useDrawing,
} from '../drawing'
import { Card, Button, CountdownTimer } from '../components/ui'
import { randomPrompt } from '../data/prompts'

const TotalTime = 60

type DrawMode = 'split' | 'overlay' | 'both'

const MODES: Array<{ id: DrawMode; label: string }> = [
  { id: 'split', label: 'Camera + Canvas' },
  { id: 'overlay', label: 'Draw on Camera' },
  { id: 'both', label: 'Camera + Overlay + Canvas' },
]

/**
 * Single-player practice mode. The computer hands you a random prompt from
 * `data/prompts.ts`; you draw it; you can save a snapshot or just hit "Next
 * prompt" to get a fresh word. No timer-forced submit, no networking.
 */
export default function SoloPage() {
  return (
    <DrawingProvider>
      <SoloInner />
    </DrawingProvider>
  )
}

function SoloInner() {
  const navigate = useNavigate()
  const { getDrawingImage } = useDrawing()
  const [mode, setMode] = useState<DrawMode>('split')
  const [prompt, setPrompt] = useState<string>(() => randomPrompt())
  const [results, setResults] = useState<Array<{ prompt: string; image: string }>>([])
  const [timerKey, setTimerKey] = useState(0)

  function handleSave() {
    const image = getDrawingImage()
    if (!image) return
    setResults((r) => [{ prompt, image }, ...r])
  }

  function handleNext() {
    setPrompt(randomPrompt())
    setTimerKey((k) => k + 1)
  }

  function handleSaveAndNext() {
    handleSave()
    handleNext()
  }

  return (
    <div className="background !justify-start">
      <Card variant="glass" className="w-full !max-w-5xl">
        <div className="flex items-start justify-between mb-3 gap-4">
          <div>
            <p className="rounds">Computer Mode</p>
            <h1 className="text-3xl">Draw: <span className="italic">{prompt}</span></h1>
            <p className="text-sm text-white/80 mt-1">
              The computer picked this prompt. Draw it, save it, then get a new one.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <CountdownTimer key={timerKey} seconds={TotalTime} />
            <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
              Home
            </Button>
          </div>
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
          Pinch to draw &middot; Open palm to erase
        </p>

        <div className="flex items-end justify-end mt-4 gap-3">
          <Button variant="outline" size="sm" onClick={handleNext}>
            Skip Prompt
          </Button>
          <Button variant="submit" size="sm" onClick={handleSaveAndNext}>
            Save + New Prompt
          </Button>
        </div>

        {results.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/80 mb-2">
              Your Drawings ({results.length})
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {results.map((r, i) => (
                <div key={i} className="bg-white/[0.10] border border-white/20 rounded-lg p-2">
                  <img
                    src={r.image}
                    alt={r.prompt}
                    className="w-full aspect-[4/3] object-contain bg-white rounded"
                  />
                  <p className="text-xs text-white/80 mt-1 text-center italic">
                    {r.prompt}
                  </p>
                </div>
              ))}
            </div>
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
