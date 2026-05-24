import { useState } from 'react'
import { Card, Button, RoundHeader, CountdownTimer } from '../components/ui'

const MaxChars = 120
const TotalTime = 60

export default function InputPage() {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit() {
    if (!input.trim() || submitted) return
    setSubmitted(true)
  }

  return (
    <div className="background">
      <Card variant="glass">
        <RoundHeader round={1} totalRounds={4} />
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
          <CountdownTimer
            seconds={TotalTime}
            paused={submitted}
            onExpire={() => setSubmitted(true)}
          />
          <Button
            variant="submit"
            size="sm"
            onClick={handleSubmit}
            disabled={submitted}
          >
            Submit
          </Button>
        </div>
      </Card>
    </div>
  )
}
