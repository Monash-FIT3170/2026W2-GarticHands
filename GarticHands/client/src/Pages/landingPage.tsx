import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page, Card, Button, Avatar } from '../components/ui'

export default function LandingPage() {
  const navigate = useNavigate()
  const [playerName, setPlayerName] = useState('')

  const canContinue = playerName.trim().length > 0

  function joinRoom() {
    if (!canContinue) return
    navigate('/join', { state: { playerName } })
  }

  function hostRoom() {
    if (!canContinue) return
    navigate('/host', { state: { playerName } })
  }

  return (
    <Page variant="centered" logo padding="px-4 pb-24">
      <Card variant="hero">
        <Avatar variant="guest" />

        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter username..."
          maxLength={20}
          className="w-full bg-white rounded-full px-6 py-3 text-center text-[#D4623E] placeholder-[#D4623E]/50 font-medium outline-none focus:ring-2 focus:ring-[#D4623E]/40"
        />

        <div className="flex gap-3 w-full">
          <Button variant="secondary" onClick={joinRoom} disabled={!canContinue} className="flex-1">
            Join Room
          </Button>
          <Button variant="primary" onClick={hostRoom} disabled={!canContinue} className="flex-1">
            Host Game
          </Button>
        </div>
      </Card>
    </Page>
  )
}
