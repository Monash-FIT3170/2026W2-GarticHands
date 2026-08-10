import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import PlayerList from '../src/components/PlayerList'
import type { Player } from '../src/types/room'

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

    expect(screen.getByText('Ash')).toBeInTheDocument()
    expect(screen.getByText('Sam')).toBeInTheDocument()
    expect(screen.getByText('Alex')).toBeInTheDocument()
  })

  test('identifies the current player in compact mode', () => {
    render(<PlayerList players={players} selfName="Sam" />)

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

    expect(screen.getAllByText('Empty')).toHaveLength(0)
  })
})