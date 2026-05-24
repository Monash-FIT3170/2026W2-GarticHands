import { useState } from 'react'
import { DrawingProvider, DrawingCameraInput, DrawingCameraCanvas } from '../drawing'
import { Card, Button, RoundHeader, CountdownTimer } from '../components/ui'

const TotalTime = 60

export default function DrawPage() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit() {
    if (submitted) return
    setSubmitted(true)
  }

  return (
    <div className="background min-h-screen p-6">
      <Card variant="glass" className="mx-auto !max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <RoundHeader round={1} totalRounds={4} />
          <CountdownTimer
            seconds={TotalTime}
            paused={submitted}
            onExpire={() => setSubmitted(true)}
          />
        </div>
        <h1 className="text-3xl mb-4">Draw with your hands</h1>

        <DrawingProvider>
          <div className="flex flex-wrap gap-6 items-start">
            <DrawingCameraInput />
            <DrawingCameraCanvas />
          </div>
        </DrawingProvider>

        <div className="flex justify-end mt-4">
          <Button variant="submit" size="sm" onClick={handleSubmit} disabled={submitted}>
            Submit Drawing
          </Button>
        </div>
      </Card>
    </div>
  )
}
