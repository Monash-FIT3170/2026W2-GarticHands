import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  DrawingProvider,
  DrawingCameraInput,
  DrawingCameraCanvas,
  useDrawing,
  useRecorder,
} from '../drawing'
import { Card, Button, RoundHeader, CountdownTimer } from '../components/ui'
import { getRoom, submitDrawing } from '../api/room'
import { usePhaseAdvance } from '../hooks/usePhaseAdvance'
import { useRecordings } from '../state/RecordingsContext'

const TotalTime = 60

type DrawMode = 'split' | 'overlay' | 'both'

const MODES: Array<{ id: DrawMode; label: string; description: string }> = [
  { id: 'split', label: 'Camera + Canvas', description: 'Camera and canvas side-by-side.' },
  { id: 'overlay', label: 'Draw on Camera', description: 'Strokes appear directly on the camera feed.' },
  { id: 'both', label: 'Camera + Overlay + Canvas', description: 'Canvas alongside, plus strokes on the camera.' },
]

export default function DrawPage() {
  return (
    <DrawingProvider>
      <DrawPageInner />
    </DrawingProvider>
  )
}

/** Inner component so `useDrawing()` finds the surrounding `<DrawingProvider>`. */
function DrawPageInner() {
  const location = useLocation()
  const navigate = useNavigate()
  const roomCode = location.state?.roomCode as string | undefined
  const playerName = location.state?.playerName as string | undefined

  const { getDrawingImage } = useDrawing()
  const recorder = useRecorder()
  const { saveRecording } = useRecordings()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [prompt, setPrompt] = useState<string>('')
  const [roundNum, setRoundNum] = useState<number | null>(null)
  const [mode, setMode] = useState<DrawMode>(loadModePreference())
  const startedRef = useRef(false)

  useEffect(() => {
    if (!roomCode || !playerName) {
      navigate('/')
      return
    }
    getRoom(roomCode).then((data) => {
      if (data.success) {
        if (data.room.prompts) setPrompt(data.room.prompts[playerName] || '')
        setRoundNum(data.room.round ?? 1)
      }
    })
  }, [roomCode, playerName, navigate])

  // Start recording once the room has been fetched and we know the round.
  // `startedRef` guards against React 18 StrictMode's double-mount + re-renders.
  useEffect(() => {
    if (startedRef.current) return
    if (roundNum === null) return
    if (!recorder.isSupported) return
    startedRef.current = true
    // Slight delay lets the camera canvas mount and start drawing frames.
    const t = setTimeout(() => recorder.start(), 400)
    return () => clearTimeout(t)
  }, [roundNum, recorder])

  // Persist mode per-player so subsequent rounds remember the choice.
  useEffect(() => {
    saveModePreference(mode)
  }, [mode])

  const { waitingFor, room } = usePhaseAdvance({
    roomCode,
    playerName,
    enabled: submitted,
    whenPhase: 'guess',
    to: '/guess',
    countBucket: 'drawings',
  })

  async function handleSubmit() {
    if (submitted || !roomCode || !playerName) return

    const dataUrl = getDrawingImage()
    if (!dataUrl) {
      setError('Canvas is not ready yet.')
      return
    }

    setSubmitted(true)
    setError('')

    // Stop recording in parallel with the submit so the playback is ready by /game.
    const recordingPromise = recorder.isRecording ? recorder.stop() : Promise.resolve(null)

    const [data, blobUrl] = await Promise.all([
      submitDrawing(roomCode, playerName, dataUrl),
      recordingPromise,
    ])

    if (blobUrl && roundNum !== null) {
      saveRecording({
        round: roundNum,
        blobUrl,
        prompt: prompt || undefined,
        createdAt: Date.now(),
      })
    }

    if (!data.success) {
      setError(data.message || 'Failed to submit drawing.')
      setSubmitted(false)
      return
    }

    if (data.room?.phase === 'guess') {
      navigate('/guess', { state: { roomCode, playerName } })
    }
  }

  function handleExpire() {
    if (!submitted) void handleSubmit()
  }

  return (
    <div className="background !justify-start">
      <Card variant="glass" className="w-full !max-w-5xl">
        <div className="flex items-start justify-between mb-3 gap-4">
          <div>
            <RoundHeader round={room?.round ?? 1} totalRounds={room?.maxRounds ?? 4} />
            <h1 className="text-3xl">Draw with your hands</h1>
            {prompt && (
              <p className="text-sm text-white/80 mt-1">
                Your prompt: <span className="font-semibold">{prompt}</span>
              </p>
            )}
          </div>
          <CountdownTimer
            seconds={TotalTime}
            paused={submitted}
            onExpire={handleExpire}
          />
        </div>

        <ModePicker value={mode} onChange={setMode} disabled={submitted} />

        {mode === 'split' && <SplitLayout />}
        {mode === 'overlay' && <OverlayLayout />}
        {mode === 'both' && <BothLayout />}

        <p className="text-xs text-white/70 mt-4 text-center">
          Pinch your index finger and thumb to draw &middot; Open palm to erase
        </p>

        <div className="flex flex-col items-end mt-4 gap-2">
          <Button variant="submit" size="sm" onClick={handleSubmit} disabled={submitted}>
            Submit Drawing
          </Button>
          {submitted && !error && (
            <p className="text-sm text-white/80">
              {waitingFor > 0
                ? `Waiting for ${waitingFor} other player${waitingFor === 1 ? '' : 's'}...`
                : 'Starting guessing phase...'}
            </p>
          )}
          {error && <p className="text-sm text-red-300">{error}</p>}
        </div>
      </Card>
    </div>
  )
}

interface ModePickerProps {
  value: DrawMode
  onChange: (mode: DrawMode) => void
  disabled?: boolean
}

/** Segmented control for the draw layout. Visible above the canvases. */
function ModePicker({ value, onChange, disabled }: ModePickerProps) {
  return (
    <div className="mt-2 mb-2">
      <div
        className={`inline-flex rounded-full bg-white/80 p-1 gap-1 ${
          disabled ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        {MODES.map((m) => {
          const selected = value === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
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

/** Side-by-side panels. Black strokes on a white canvas. */
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

/** Camera with strokes drawn directly on top — no separate canvas surface. */
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

/** Camera with overlay AND a separate canvas. Both canvases register with the
 *  same DrawingProvider, so strokes appear in both in lockstep. The black
 *  canvas is mounted first → it's the primary (submitted) one. */
function BothLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      <Panel label="Camera + Overlay">
        <div className="relative">
          <DrawingCameraInput />
          {/* Mounted second, so it's the shadow overlay — not submitted. */}
          <DrawingCameraCanvas
            strokeColor="white"
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </Panel>
      <Panel label="Canvas">
        {/* Mounted first → primary canvas. This is what gets submitted. */}
        <DrawingCameraCanvas strokeColor="black" />
      </Panel>
    </div>
  )
}

interface PanelProps {
  label: string
  children: React.ReactNode
}

/** Small in-card panel — caption above a rounded surface. */
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

// ---------------------------------------------------------------------------
// Mode preference persistence
// ---------------------------------------------------------------------------

const MODE_STORAGE_KEY = 'gartichands:drawMode'

function loadModePreference(): DrawMode {
  try {
    const v = localStorage.getItem(MODE_STORAGE_KEY)
    if (v === 'split' || v === 'overlay' || v === 'both') return v
  } catch {
    /* localStorage may be unavailable in some contexts — ignore. */
  }
  return 'split'
}

function saveModePreference(mode: DrawMode) {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode)
  } catch {
    /* ignore */
  }
}
