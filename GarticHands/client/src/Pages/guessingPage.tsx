import { useState } from 'react'
import { Card, Button, RoundHeader, CountdownTimer } from '../components/ui'

const MaxChars = 120
const TotalTime = 60

export default function GuessingPage() {
  const [guess, setGuess] = useState('')

  const drawnBy = 'Lily'

  function handleSubmit() {
    if (!guess.trim()) return
    setGuess('')
  }

  return (
    <div className="background">
      <Card variant="glass">
        <RoundHeader round={1} totalRounds={4} />
        <h1 className="text-3xl">Guess this Drawing</h1>
        <p className="text-sm text-black/45 mb-5">Drawn by {drawnBy}</p>
        <div className="w-full h-48 bg-white/[0.14] rounded-lg mb-5" />
        <div className="flex items-center justify-between mb-3">
          <CountdownTimer seconds={TotalTime} suffix=" seconds left" />
        </div>
        <input
          type="text"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          maxLength={MaxChars}
          placeholder="What is this drawing?"
        />
        <Button
          variant="submit"
          size="sm"
          onClick={handleSubmit}
          disabled={!guess.trim()}
        >
          Submit Guess
        </Button>
      </Card>
    </div>
  )
}
