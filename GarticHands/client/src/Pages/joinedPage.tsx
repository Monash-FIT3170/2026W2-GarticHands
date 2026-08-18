import { useState, useEffect, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getRoom, updateReady, startRoom } from '../api/room'
import { Page, Card, Button, useToast } from '../components/ui'
import PlayerList from '../components/PlayerList'
import type { Player, DrawLocationState } from '../types/room'

const MAX_PLAYERS_DISPLAY = 4
const MAX_PLAYERS = 4

export default function JoinedPage() {
  const { roomCode } = useParams()
  const location = useLocation()
  const state = location.state as DrawLocationState | null
  const playerName = state?.playerName
  const navigate = useNavigate()

  const [players, setPlayers] = useState<Player[]>(state?.room?.players ?? [])
  const [ready, setReady] = useState(false)
  const [starting, setStarting] = useState(false)
  const { toast, show } = useToast('pill')

  const me = players.find((p) => p.name === playerName)
  const isHost = me?.isHost ?? false
  const readyCount = players.filter((p) => p.ready || p.isHost).length
  const allReady = players.length > 0 && players.every((p) => p.ready || p.isHost)

  const copyCode = useCallback(() => {
    if (!roomCode) return
    navigator.clipboard.writeText(roomCode).catch(() => { })
    show('Room code copied!')
  }, [roomCode, show])

  useEffect(() => {
    if (!roomCode) return

    let alreadyStarted = false

    async function loadRoom() {
      const data = await getRoom(roomCode as string)
      if (!data.success || !data.room) return

      setPlayers(data.room.players)

      if (data.room.status === 'started' && !alreadyStarted) {
        alreadyStarted = true
        setStarting(true)
        show('Starting game...')
        setTimeout(() => { void navigate('/input', { state: { roomCode, playerName }, })}, 2000,)
        return
      }

      if (alreadyStarted) return

      const meFresh = data.room.players.find((p: Player) => p.name === playerName)
      if (meFresh) setReady(meFresh.ready)
    }

    void loadRoom()
    const interval = setInterval(() => {void loadRoom()}, 1000)
    return () => clearInterval(interval)
  }, [roomCode, playerName, navigate, show])

  async function handleReady() {
    if (!roomCode || !playerName || starting) return
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
  }

  return (
    <Page variant="centered" logo>
      <Card variant="lobby">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8">
          <section className="rounded-xl p-6" style={{ backgroundColor: 'rgba(22, 89, 74, 0.2)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white text-2xl font-extrabold tracking-wide">
                PLAYERS {players.length}/{MAX_PLAYERS}
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
            <div className="rounded-xl p-6 w-full flex flex-col items-center" style={{ backgroundColor: 'rgba(22, 89, 74, 0.2)' }}>
              <h2 className="text-white text-2xl font-extrabold tracking-wide mb-5">GAMEMODE</h2>
              <div className="bg-white rounded-lg border-4 border-[#78EF57] flex flex-col items-center justify-center shadow-sm w-full max-w-[200px]">
                <img src="/gamemode_classic.png" alt="Classic" className="w-16 h-16 mb-2 object-contain" />
                <p className="text-[#2E5534] font-extrabold">Classic</p>
              </div>
            </div>

            <div className="mt-6 w-full flex flex-col items-center gap-2">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Room Code</p>
              <p className="text-white font-mono font-extrabold text-4xl tracking-[0.3em]">{roomCode}</p>
              <Button variant="outline" size="full" onClick={copyCode}>
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy Room Code
                </span>
              </Button>
            </div>

            {isHost ? (
              <Button
                variant="start"
                size="full"
                onClick={() => void handleStart()}
                disabled={!allReady || starting}
                className="mt-4"
              >
                {allReady ? 'Start Game' : 'Waiting for Players'}
              </Button>
            ) : (
              <Button
                variant="ready"
                active={ready}
                size="full"
                onClick={() => void handleReady()}
                disabled={starting}
                className="mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ready ? 'Ready' : 'Ready Up'}
              </Button>
            )}
          </section>
        </div>
      </Card>

      {toast}
    </Page>
  )
}