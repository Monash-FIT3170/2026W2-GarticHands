import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRoom } from '../api/room'
import type { Room, RoomPhase } from '../types/room'

interface UsePhaseAdvanceOptions {
  roomCode: string | undefined
  playerName: string | undefined
  /** Only navigate (and count submissions) once this is true. Polling runs regardless. */
  enabled: boolean
  /** Phase value that triggers navigation. */
  whenPhase: RoomPhase
  /** Route to navigate to once the phase transitions. */
  to: string
  /** Bucket name to count how many players have submitted. */
  countBucket?: 'prompts' | 'drawings' | 'guesses'
  /** Polling cadence in ms. Default: 1000. */
  intervalMs?: number
}

interface UsePhaseAdvanceResult {
  waitingFor: number
  room: Room | null
}

/**
 * Polls the room every second from mount. When the room reports `phase === whenPhase`
 * **and** `enabled` is true, navigates to `to` carrying `{ roomCode, playerName }`.
 *
 * Polling from mount means `room` is always available for things like
 * `<RoundHeader round={room?.round} totalRounds={room?.maxRounds} />` — even before
 * the player has submitted.
 */
export function usePhaseAdvance({
  roomCode,
  playerName,
  enabled,
  whenPhase,
  to,
  countBucket,
  intervalMs = 1000,
}: UsePhaseAdvanceOptions): UsePhaseAdvanceResult {
  const navigate = useNavigate()
  const [waitingFor, setWaitingFor] = useState(0)
  const [room, setRoom] = useState<Room | null>(null)

  useEffect(() => {
    if (!roomCode) return

    let cancelled = false

    async function tick() {
      if (!roomCode) return
      const data = await getRoom(roomCode)
      if (cancelled || !data.success) return

      const fresh = data.room as Room
      setRoom(fresh)

      if (enabled && countBucket) {
        const submitted = Object.values(fresh[countBucket] || {}).filter(
          (v) => v !== undefined && v !== null && v !== '',
        ).length
        setWaitingFor(Math.max(0, fresh.players.length - submitted))
      }

      if (enabled && fresh.phase === whenPhase) {
        cancelled = true
        void navigate(to, { state: { roomCode, playerName } })
      }
    }

    void tick()
    const interval = setInterval(() => {void tick()}, intervalMs)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [enabled, roomCode, playerName, whenPhase, to, countBucket, intervalMs, navigate])

  return { waitingFor, room }
}
