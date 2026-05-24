/**
 * Canonical data shapes mirrored from the server. Update this file when the server's
 * `Room` / `Player` types change — both sides must agree.
 *
 * See [`../../server/index.js`](../../server/index.js) for the server-side source of truth
 * and [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md#data-shapes-canonical) for context.
 */

export type PlayerStatus = 'host' | 'waiting' | 'ready'

export interface Player {
  name: string
  status: PlayerStatus
  isHost: boolean
  ready: boolean
  joinedAt: number
}

export type RoomStatus = 'waiting' | 'started'

export interface Room {
  code: string
  players: Player[]
  status: RoomStatus
  createdAt: number
}
