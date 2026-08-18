/**
 * PlayerList.test.tsx
 *
 * Component tests for `<PlayerList />` (client/src/components/PlayerList).
 *
 * `PlayerList` renders a list of players (e.g. in a game lobby) and supports:
 *  - A default/compact display of player names and status.
 *  - Highlighting the current user via `selfName` (renders "<name> (you)").
 *  - A 'lobby' variant that can pad the list out to a fixed size (`padTo`)
 *    with "Empty" placeholder slots, e.g. to always show a fixed max-players
 *    grid regardless of how many people have joined so far.
 *
 * These tests use a shared `players` fixture (3 players in different states:
 * host, ready, waiting) reused across all test cases below.
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import PlayerList from '../client/src/components/PlayerList'
import type { Player } from '../client/src/types/room'

// Fixture data: 3 players covering the different states PlayerList can render
// (host, ready-but-not-host, and waiting/not-ready).
const players: Player[] = [
  {
    name: 'Ash',
    status: 'host',
    isHost: true,
    ready: true,
    joinedAt: 1,
  },
  {
    name: 'Sam',
    status: 'ready',
    isHost: false,
    ready: true,
    joinedAt: 2,
  },
  {
    name: 'Alex',
    status: 'waiting',
    isHost: false,
    ready: false,
    joinedAt: 3,
  },
]

describe('PlayerList', () => {
  test('displays all players in the lobby', () => {
    render(<PlayerList players={players} />)

    // Every player's name should be visible somewhere in the rendered list.
    expect(screen.getByText('Ash')).toBeInTheDocument()
    expect(screen.getByText('Sam')).toBeInTheDocument()
    expect(screen.getByText('Alex')).toBeInTheDocument()
  })

  test('identifies the current player in compact mode', () => {
    render(<PlayerList players={players} selfName="Sam" />)

    // When `selfName` matches a player, that player's row should be
    // suffixed with "(you)" so the current user can spot themselves.
    expect(screen.getByText('Sam (you)')).toBeInTheDocument()
  })

  test('displays empty lobby slots when padding is requested', () => {
    render(
      <PlayerList
        players={players}
        variant="lobby"
        padTo={5}
      />,
    )

    // 3 real players + padTo=5, 2 "Empty" placeholder slots should render
    // to fill out the lobby grid to a fixed size.
    expect(screen.getAllByText('Empty')).toHaveLength(2)
  })

  test('renders the correct number of players without adding empty slots', () => {
    render(
      <PlayerList
        players={players}
        variant="lobby"
        padTo={2}
      />,
    )

    // padTo (2) is less than the actual player count (3), so no padding
    // should be added, zero "Empty" slots expected.
    // `queryAllByText` (not `getAllByText`) is used here because it returns
    // an empty array instead of throwing when there are zero matches.
    expect(screen.queryAllByText('Empty')).toHaveLength(0)
  })
})