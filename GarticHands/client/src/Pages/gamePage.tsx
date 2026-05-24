import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, Button, RoundHeader } from '../components/ui'
import { getRoom, restartRoom, endRoom } from '../api/room'
import type { Player, Room } from '../types/room'

interface RevealChain {
  drawer: Player
  prompt: string
  drawing: string
  guesserName: string
  guess: string
}

export default function GamePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const roomCode = location.state?.roomCode as string | undefined
  const playerName = location.state?.playerName as string | undefined

  const [room, setRoom] = useState<Room | null>(null)
  const [working, setWorking] = useState(false)

  useEffect(() => {
    if (!roomCode || !playerName) {
      navigate('/')
      return
    }

    let cancelled = false

    async function load() {
      if (!roomCode) return
      const data = await getRoom(roomCode)
      if (cancelled || !data.success) return
      setRoom(data.room as Room)

      // Host restarted into a new round → bounce to /input.
      if (data.room.phase === 'prompt') {
        cancelled = true
        navigate('/input', { state: { roomCode, playerName } })
        return
      }

      // Host ended the game → bounce back to the lobby.
      if (data.room.phase === 'lobby') {
        cancelled = true
        navigate(`/joined/${roomCode}`, { state: { roomCode, playerName } })
      }
    }

    load()
    const interval = setInterval(load, 1500)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [roomCode, playerName, navigate])

  const isHost = room?.players.find((p) => p.name === playerName)?.isHost ?? false
  const round = room?.round ?? 1
  const maxRounds = room?.maxRounds ?? 4
  const isFinalRound = round >= maxRounds
  const chains = room ? buildRevealChains(room) : []

  async function handlePlayAgain() {
    if (!roomCode || working) return
    setWorking(true)
    await restartRoom(roomCode)
    // Polling effect will redirect on phase === 'prompt'.
  }

  async function handleBackToLobby() {
    if (!roomCode || working) return
    setWorking(true)
    await endRoom(roomCode)
    // Polling effect will redirect on phase === 'lobby'.
  }

  return (
    <div className="background">
      <Card variant="glass" className="mx-auto !max-w-3xl">
        <RoundHeader round={round} totalRounds={maxRounds} />
        <h1 className="text-3xl mb-4">Reveal</h1>

        {!room && <p className="text-sm text-white/70">Loading results...</p>}

        {room && chains.length === 0 && (
          <p className="text-sm text-white/70">No drawings to reveal.</p>
        )}

        <div className="space-y-6">
          {chains.map((chain) => (
            <RevealRow key={chain.drawer.name} chain={chain} />
          ))}
        </div>

        <div className="flex flex-col items-end mt-6 gap-2">
          {isHost ? (
            isFinalRound ? (
              <Button variant="outline" size="full" onClick={handleBackToLobby} disabled={working}>
                {working ? 'Returning...' : 'Back to Lobby'}
              </Button>
            ) : (
              <Button variant="start" size="full" onClick={handlePlayAgain} disabled={working}>
                {working ? 'Starting...' : `Play Round ${round + 1}`}
              </Button>
            )
          ) : (
            <p className="text-sm text-white/70">
              {isFinalRound
                ? 'Waiting for the host to return to the lobby...'
                : 'Waiting for the host to start the next round...'}
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}

function RevealRow({ chain }: { chain: RevealChain }) {
  return (
    <div className="bg-white/[0.10] border border-white/[0.20] rounded-xl p-4">
      <p className="text-sm text-white/80">
        <span className="font-semibold">{chain.drawer.name}</span> wrote:{' '}
        <span className="italic">"{chain.prompt || '(no prompt)'}"</span>
      </p>
      {chain.drawing ? (
        <img
          src={chain.drawing}
          alt={`Drawing by ${chain.drawer.name}`}
          className="w-full h-56 object-contain bg-white rounded-lg my-3"
        />
      ) : (
        <div className="w-full h-56 bg-white/[0.14] rounded-lg my-3 flex items-center justify-center text-sm text-white/70">
          No drawing submitted
        </div>
      )}
      <p className="text-sm text-white/80">
        <span className="font-semibold">{chain.guesserName}</span> guessed:{' '}
        <span className="italic">"{chain.guess || '(no guess)'}"</span>
      </p>
    </div>
  )
}

/**
 * One reveal row per drawer. Cycle is "player M guessed player M+1's drawing",
 * so the guesser for drawer at index `i` is the player at index (i − 1 + N) % N.
 */
function buildRevealChains(room: Room): RevealChain[] {
  const players = room.players
  if (players.length === 0) return []
  return players.map((drawer, i) => {
    const guesserIndex = (i - 1 + players.length) % players.length
    const guesser = players[guesserIndex]
    return {
      drawer,
      prompt: room.prompts?.[drawer.name] ?? '',
      drawing: room.drawings?.[drawer.name] ?? '',
      guesserName: guesser.name,
      guess: room.guesses?.[guesser.name] ?? '',
    }
  })
}
