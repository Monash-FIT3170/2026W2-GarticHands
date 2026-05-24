import { useState, useEffect, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getRoom, updateReady } from '../api/room'
import { Button, useToast } from '../components/ui'
import PlayerList from '../components/PlayerList'
import type { Player } from '../types/room'

export default function JoinedPage() {
  const { roomCode } = useParams()
  const location = useLocation()
  const playerName = location.state?.playerName as string | undefined
  const navigate = useNavigate()

  const [players, setPlayers] = useState<Player[]>(location.state?.room?.players || [])
  const [ready, setReady] = useState(false)
  const { toast, show } = useToast('default')

  const copyCode = useCallback(() => {
    if (!roomCode) return
    navigator.clipboard.writeText(roomCode).catch(() => {})
    show('Room code copied!')
  }, [roomCode, show])

  useEffect(() => {
    if (!roomCode) return

    async function loadRoom() {
      const data = await getRoom(roomCode as string)
      if (!data.success) return

      setPlayers(data.room.players)

      if (data.room.status === 'started') {
        show('Starting game...')
        setTimeout(() => navigate('/input'), 2000)
        return
      }

      const me = data.room.players.find((p: Player) => p.name === playerName)
      if (me) setReady(me.ready)
    }

    loadRoom()
    const interval = setInterval(loadRoom, 1000)
    return () => clearInterval(interval)
  }, [roomCode, playerName, navigate, show])

  async function handleReady() {
    if (!roomCode || !playerName) return
    const next = !ready
    const data = await updateReady(roomCode, playerName, next)
    if (data.success) {
      setReady(next)
      setPlayers(data.room.players)
    }
  }

  const readyCount = players.filter((p) => p.ready).length

  return (
    <div className="joined-page">
      <h1 className="text-4xl font-bold mb-6">Lobby</h1>

      <div className="mb-4">
        <span
          className="text-lg font-mono tracking-wide bg-neutral-500 rounded cursor-pointer px-3 py-1"
          onClick={copyCode}
        >
          {roomCode || 'No room'}
        </span>
      </div>

      <PlayerList players={players} selfName={playerName} variant="compact" />

      <Button variant="ghost" size="custom" active={ready} onClick={handleReady} className="mt-6 px-6 py-3">
        {ready ? 'Ready' : 'Not Ready'}
      </Button>

      <p className="mt-4 text-sm text-gray-400">
        {readyCount} of {players.length} players are ready
      </p>

      {toast}
    </div>
  )
}
