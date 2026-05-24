import { useState, useEffect, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getRoom, updateReady, startRoom } from '../api/room'
import { Page, Card, Button, Avatar, useToast } from '../components/ui'
import PlayerList from '../components/PlayerList'
import type { Player } from '../types/room'

const MAX_PLAYERS_DISPLAY = 4

export default function JoinedPage() {
  const { roomCode } = useParams()
  const location = useLocation()
  const playerName = location.state?.playerName as string | undefined
  const navigate = useNavigate()

  const [players, setPlayers] = useState<Player[]>(location.state?.room?.players || [])
  const [ready, setReady] = useState(false)
  const [starting, setStarting] = useState(false)
  const { toast, show } = useToast('pill')

  const me = players.find((p) => p.name === playerName)
  const isHost = me?.isHost ?? false
  const readyCount = players.filter((p) => p.ready || p.isHost).length
  const allReady = players.length > 0 && players.every((p) => p.ready || p.isHost)

  const copyCode = useCallback(() => {
    if (!roomCode) return
    navigator.clipboard.writeText(roomCode).catch(() => {})
    show('Room code copied!')
  }, [roomCode, show])

  useEffect(() => {
    if (!roomCode) return

    let alreadyStarted = false

    async function loadRoom() {
      const data = await getRoom(roomCode as string)
      if (!data.success) return

      setPlayers(data.room.players)

      if (data.room.status === 'started' && !alreadyStarted) {
        alreadyStarted = true
        setStarting(true)
        show('Starting game...')
        setTimeout(
          () => navigate('/input', { state: { roomCode, playerName } }),
          2000,
        )
        return
      }

      if (alreadyStarted) return

      const meFresh = data.room.players.find((p: Player) => p.name === playerName)
      if (meFresh) setReady(meFresh.ready)
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

  async function handleStart() {
    if (!roomCode || !allReady || starting) return
    setStarting(true)
    await startRoom(roomCode)
    show('Starting game...')
    // Polling loop will navigate to /input.
  }

  return (
    <Page variant="centered" logo compactLogo>
      <Card variant="lobby">
        <Avatar variant="host-large" letter={playerName?.charAt(0)} />

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

            <PlayerList
              players={players}
              selfName={playerName}
              variant="lobby"
              padTo={MAX_PLAYERS_DISPLAY}
            />
          </section>

          <section className="flex flex-col items-center">
            <h2 className="text-white text-2xl font-extrabold tracking-wide mb-5">LOBBY</h2>

            <p className="text-white/80 text-sm font-semibold text-center mb-5">
              {isHost
                ? 'Wait until every player is ready, then start the game.'
                : 'Click "Ready" when you are ready to play.'}
            </p>

            <Button variant="outline" size="full" onClick={copyCode}>
              Copy Invite Code
            </Button>

            {isHost ? (
              <Button
                variant="start"
                size="full"
                onClick={handleStart}
                disabled={!allReady || starting}
                className="mt-4"
              >
                {allReady ? 'Start Game' : 'Waiting for Players'}
              </Button>
            ) : (
              <Button
                variant="start"
                size="full"
                onClick={handleReady}
                disabled={starting}
                className="mt-4"
              >
                {ready ? "I'm Ready" : 'Click when Ready'}
              </Button>
            )}

            <p className="mt-4 text-white/80 text-sm text-center font-semibold">
              Room Code:{' '}
              <button onClick={copyCode} className="font-mono underline">
                {roomCode || '...'}
              </button>
            </p>
          </section>
        </div>
      </Card>

      {toast}
    </Page>
  )
}
