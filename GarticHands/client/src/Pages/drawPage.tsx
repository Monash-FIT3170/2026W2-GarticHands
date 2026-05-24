import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  DrawingProvider,
  DrawingCameraInput,
  DrawingCameraCanvas,
  useDrawing,
} from '../drawing'
import { Card, Button, RoundHeader, CountdownTimer } from '../components/ui'
import { getRoom, submitDrawing } from '../api/room'
import { usePhaseAdvance } from '../hooks/usePhaseAdvance'

const TotalTime = 60

export default function DrawPage() {
  return (
    <DrawingProvider>
      <DrawPageInner />
    </DrawingProvider>
  )
}

/**
 * Inner component so we can call `useDrawing()` — that hook needs the surrounding
 * `<DrawingProvider>` already mounted.
 */
function DrawPageInner() {
  const location = useLocation()
  const navigate = useNavigate()
  const roomCode = location.state?.roomCode as string | undefined
  const playerName = location.state?.playerName as string | undefined

  const { getDrawingImage } = useDrawing()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [prompt, setPrompt] = useState<string>('')

  useEffect(() => {
    if (!roomCode || !playerName) {
      navigate('/')
      return
    }
    // Fetch this player's own prompt so we can show "Draw: <prompt>".
    getRoom(roomCode).then((data) => {
      if (data.success && data.room.prompts) {
        setPrompt(data.room.prompts[playerName] || '')
      }
    })
  }, [roomCode, playerName, navigate])

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

    const data = await submitDrawing(roomCode, playerName, dataUrl)
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
    <div className="background min-h-screen p-6">
      <Card variant="glass" className="mx-auto !max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <RoundHeader round={room?.round ?? 1} totalRounds={room?.maxRounds ?? 4} />
          <CountdownTimer
            seconds={TotalTime}
            paused={submitted}
            onExpire={handleExpire}
          />
        </div>
        <h1 className="text-3xl mb-1">Draw with your hands</h1>
        {prompt && (
          <p className="text-sm text-black/60 mb-4">
            Your prompt: <span className="font-semibold">{prompt}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-6 items-start">
          <DrawingCameraInput />
          <DrawingCameraCanvas />
        </div>

        <div className="flex flex-col items-end mt-4 gap-2">
          <Button variant="submit" size="sm" onClick={handleSubmit} disabled={submitted}>
            Submit Drawing
          </Button>
          {submitted && !error && (
            <p className="text-sm text-black/60">
              {waitingFor > 0
                ? `Waiting for ${waitingFor} other player${waitingFor === 1 ? '' : 's'}...`
                : 'Starting guessing phase...'}
            </p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </Card>
    </div>
  )
}
