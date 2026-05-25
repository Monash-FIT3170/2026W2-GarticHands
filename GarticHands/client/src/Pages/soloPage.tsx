import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DrawingProvider,
  DrawingStage,
  DrawingModePicker,
  useDrawing,
  useDrawingMode,
} from '../drawing'
import { Card, Button, CountdownTimer } from '../components/ui'
import { randomPrompt } from '../data/prompts'

const TotalTime = 60

interface SavedDrawing {
  prompt: string
  image: string
}

/**
 * Single-player practice mode. The computer hands you a random prompt from
 * `data/prompts.ts`; you draw it; save a snapshot or skip to a fresh word.
 * No timer-forced submit, no networking.
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
  const [mode, setMode] = useDrawingMode()
  const [prompt, setPrompt] = useState<string>(() => randomPrompt())
  const [results, setResults] = useState<SavedDrawing[]>([])
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
            <h1 className="text-3xl">
              Draw: <span className="italic">{prompt}</span>
            </h1>
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

        <DrawingModePicker mode={mode} onModeChange={setMode} />
        <DrawingStage mode={mode} />

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
                <div
                  key={i}
                  className="bg-white/[0.10] border border-white/20 rounded-lg p-2"
                >
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
