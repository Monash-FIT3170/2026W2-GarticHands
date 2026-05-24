import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { createRoom, getRoom, startRoom } from '../api/room'
import { Page, Card, Button, Avatar, useToast } from '../components/ui'
import PlayerList from '../components/PlayerList'
import type { Player } from '../types/room'

const MAX_PLAYERS_DISPLAY = 4

export default function HostingPage() {
  const [roomCode, setRoomCode] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const { toast, show } = useToast('pill')

  const navigate = useNavigate()
  const location = useLocation()
  const hostName = location.state?.playerName as string | undefined

  useEffect(() => {
    async function setupRoom() {
      if (!hostName) {
        navigate('/')
        return
      }
      const data = await createRoom(hostName)
      if (data.success) {
        setRoomCode(data.roomCode)
        setPlayers(data.room.players)
      }
    }
    setupRoom()
  }, [hostName, navigate])

  useEffect(() => {
    if (!roomCode) return
    async function loadRoom() {
      const data = await getRoom(roomCode)
      if (data.success) setPlayers(data.room.players)
    }
    const interval = setInterval(loadRoom, 1000)
    return () => clearInterval(interval)
  }, [roomCode])

  const readyCount = players.filter((p) => p.ready || p.isHost).length
  const allReady = players.length > 0 && players.every((p) => p.ready || p.isHost)

  function copyCode() {
    if (!roomCode) return
    navigator.clipboard.writeText(roomCode).catch(() => {})
    show('Invite code copied!')
  }

  async function handleStart() {
    if (!allReady) return
    await startRoom(roomCode)
    show('Starting game...')
    setTimeout(() => navigate('/input'), 1200)
  }

  return (
    <Page variant="centered" logo compactLogo>
      <Card variant="lobby">
        <Avatar variant="host-large" letter={hostName?.charAt(0)} />

        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8 mt-8">
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white text-2xl font-extrabold tracking-wide">
                PLAYERS {players.length}
              </h2>
              <p className="text-white/80 text-sm font-semibold">
                {readyCount}/{players.length} ready
              </p>
            </div>

            <PlayerList players={players} selfName={hostName} variant="lobby" padTo={MAX_PLAYERS_DISPLAY} />
          </section>

          <section className="flex flex-col items-center">
            <h2 className="text-white text-2xl font-extrabold tracking-wide mb-5">GAMEMODE</h2>
            <GamemodeSelect />

            <Button variant="outline" size="full" onClick={copyCode} className="mt-6">
              Copy Invite Code
            </Button>

            <Button variant="start" size="full" onClick={handleStart} disabled={!allReady} className="mt-4">
              {allReady ? 'Start Game' : 'Waiting for Players'}
            </Button>

            <p className="mt-4 text-white/80 text-sm text-center font-semibold">
              Room Code:{' '}
              <button onClick={copyCode} className="font-mono underline">
                {roomCode || 'Creating...'}
              </button>
            </p>
          </section>
        </div>
      </Card>

      {toast}
    </Page>
  )
}

function GamemodeSelect() {
  return (
    <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
      <button className="bg-white rounded-lg border-4 border-[#78EF57] px-4 py-4 flex flex-col items-center justify-center shadow-sm">
        <div className="text-3xl mb-1">🎨</div>
        <p className="text-[#2E5534] font-extrabold">Classic</p>
      </button>
      <button className="bg-white rounded-lg border-4 border-transparent px-4 py-4 flex flex-col items-center justify-center shadow-sm opacity-90">
        <div className="text-3xl mb-1">🤖</div>
        <p className="text-[#2E5534] font-extrabold">AI Guessing</p>
      </button>
    </div>
  )
}
