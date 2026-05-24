import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, Button, RoundHeader, CountdownTimer } from '../components/ui'
import { submitPrompt } from '../api/room'
import { usePhaseAdvance } from '../hooks/usePhaseAdvance'

const MaxChars = 120
const TotalTime = 60

export default function InputPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const roomCode = location.state?.roomCode as string | undefined
  const playerName = location.state?.playerName as string | undefined

  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!roomCode || !playerName) navigate('/')
  }, [roomCode, playerName, navigate])

  const { waitingFor, room } = usePhaseAdvance({
    roomCode,
    playerName,
    enabled: submitted,
    whenPhase: 'draw',
    to: '/draw',
    countBucket: 'prompts',
  })

  async function handleSubmit() {
    if (!input.trim() || submitted || !roomCode || !playerName) return

    setSubmitted(true)
    setError('')

    const data = await submitPrompt(roomCode, playerName, input.trim())
    if (!data.success) {
      setError(data.message || 'Failed to submit prompt.')
      setSubmitted(false)
      return
    }

    if (data.room?.phase === 'draw') {
      navigate('/draw', { state: { roomCode, playerName } })
    }
  }

  function handleExpire() {
    if (!submitted) void handleSubmit()
  }

  return (
    <div className="background">
      <Card variant="glass">
        <RoundHeader round={room?.round ?? 1} totalRounds={room?.maxRounds ?? 4} />
        <h1 className="text-3xl">Write a sentence</h1>
        <input
          type="text"
          className="text box"
          maxLength={MaxChars}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={submitted}
          placeholder="Start typing your prompt here..."
        />
        <div className="flex items-center justify-between mt-3">
          <CountdownTimer seconds={TotalTime} paused={submitted} onExpire={handleExpire} />
          <Button variant="submit" size="sm" onClick={handleSubmit} disabled={submitted}>
            Submit
          </Button>
        </div>

        {submitted && !error && (
          <p className="text-sm text-black/60 mt-3">
            {waitingFor > 0
              ? `Waiting for ${waitingFor} other player${waitingFor === 1 ? '' : 's'}...`
              : 'Starting drawing phase...'}
          </p>
        )}
        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
      </Card>
    </div>
  )
}
