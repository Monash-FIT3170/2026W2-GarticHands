import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, Button, RoundHeader, CountdownTimer } from '../components/ui'
import { getRoom, submitGuess } from '../api/room'
import { usePhaseAdvance } from '../hooks/usePhaseAdvance'
import type { Player } from '../types/room'

const MaxChars = 120
const TotalTime = 60

export default function GuessingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const roomCode = location.state?.roomCode as string | undefined
  const playerName = location.state?.playerName as string | undefined

  const [guess, setGuess] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [drawing, setDrawing] = useState<string>('')
  const [drawnBy, setDrawnBy] = useState<string>('...')

  useEffect(() => {
    if (!roomCode || !playerName) {
      navigate('/')
      return
    }

    // Pick the player whose drawing we'll guess: the next player in the player list,
    // wrapping around. Deterministic across clients because the list order is shared.
    getRoom(roomCode).then((data) => {
      if (!data.success) return
      const players: Player[] = data.room.players
      const myIndex = players.findIndex((p) => p.name === playerName)
      if (myIndex === -1) return
      const target = players[(myIndex + 1) % players.length]
      setDrawnBy(target.name)
      setDrawing((data.room.drawings && data.room.drawings[target.name]) || '')
    })
  }, [roomCode, playerName, navigate])

  const { waitingFor, room } = usePhaseAdvance({
    roomCode,
    playerName,
    enabled: submitted,
    whenPhase: 'reveal',
    to: '/game',
    countBucket: 'guesses',
  })

  async function handleSubmit() {
    if (!guess.trim() || submitted || !roomCode || !playerName) return

    setSubmitted(true)
    setError('')

    const data = await submitGuess(roomCode, playerName, guess.trim())
    if (!data.success) {
      setError(data.message || 'Failed to submit guess.')
      setSubmitted(false)
      return
    }

    if (data.room?.phase === 'reveal') {
      navigate('/game', { state: { roomCode, playerName } })
    }
  }

  function handleExpire() {
    if (!submitted && guess.trim()) void handleSubmit()
    else if (!submitted) {
      // Auto-submit an empty string so the round still advances.
      setSubmitted(true)
      if (roomCode && playerName) {
        void submitGuess(roomCode, playerName, '')
      }
    }
  }

  return (
    <div className="background">
      <Card variant="glass">
        <RoundHeader round={room?.round ?? 1} totalRounds={room?.maxRounds ?? 4} />
        <h1 className="text-3xl">Guess this Drawing</h1>
        <p className="text-sm text-black/45 mb-5">Drawn by {drawnBy}</p>
        {drawing ? (
          <img src={drawing} alt={`Drawing by ${drawnBy}`} className="w-full h-48 object-contain bg-white/[0.14] rounded-lg mb-5" />
        ) : (
          <div className="w-full h-48 bg-white/[0.14] rounded-lg mb-5 flex items-center justify-center text-sm text-black/50">
            Loading drawing...
          </div>
        )}
        <div className="flex items-center justify-between mb-3">
          <CountdownTimer
            seconds={TotalTime}
            paused={submitted}
            onExpire={handleExpire}
            suffix=" seconds left"
          />
        </div>
        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          maxLength={MaxChars}
          placeholder="What is this drawing?"
          disabled={submitted}
        />
        <Button
          variant="submit"
          size="sm"
          onClick={handleSubmit}
          disabled={!guess.trim() || submitted}
        >
          Submit Guess
        </Button>

        {submitted && !error && (
          <p className="text-sm text-black/60 mt-3">
            {waitingFor > 0
              ? `Waiting for ${waitingFor} other player${waitingFor === 1 ? '' : 's'}...`
              : 'Revealing results...'}
          </p>
        )}
        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
      </Card>
    </div>
  )
}
