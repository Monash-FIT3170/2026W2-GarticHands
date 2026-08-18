import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { joinRoom } from '../api/room'
import { Page, Card, Button, Avatar } from '../components/ui'
import type { DrawLocationState } from '../types/room'

export default function JoiningPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as DrawLocationState | null
  const playerName = state?.playerName

  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleJoin() {
    if (!playerName) {
      void navigate('/')
      return
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code.')
      return
    }

    setSubmitting(true)
    setError('')

    const data = await joinRoom(roomCode, playerName)
    setSubmitting(false)

    if (!data.success) {
      setError(data.message || 'Room not found.')
      return
    }

    void navigate(`/joined/${data.room.code}`, {
      state: { room: data.room, playerName },
    })
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') void handleJoin()
  }

  const canSubmit = roomCode.trim().length > 0 && !submitting

  return (
    <Page variant="centered" logo padding="px-4 pb-24">
      <Card variant="hero">
        <Avatar variant="guest" />

        <div className="w-full text-center">
          <h2 className="text-white text-2xl font-extrabold tracking-wide mb-1">Join a Game</h2>
          <p className="text-white/80 text-sm font-semibold">Enter the room code your host shared.</p>
        </div>

        <input
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          onKeyDown={handleKey}
          placeholder="ABC123"
          maxLength={6}
          className="w-full bg-white rounded-full px-6 py-3 text-center text-[#D4623E] placeholder-[#D4623E]/40 font-mono font-bold tracking-[0.4em] text-lg outline-none focus:ring-2 focus:ring-[#D4623E]/40"
        />

        {error && (
          <p className="text-sm font-semibold text-red-200 -mt-2">{error}</p>
        )}

        <div className="flex gap-3 w-full">
          <Button
            variant="secondary"
            onClick={() => void navigate('/')}
            disabled={submitting}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleJoin()}
            disabled={!canSubmit}
            className="flex-1"
          >
            {submitting ? 'Joining...' : 'Join Game'}
          </Button>
        </div>
      </Card>
    </Page>
  )
}
