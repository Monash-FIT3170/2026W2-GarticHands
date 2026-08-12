/**
 * HostingPage.test.tsx
 *
 * Component tests for HostingPage (client/src/pages/HostingPage).
 *
 * HostingPage is the room lobby screen shown to the host after creating a
 * room. On mount it calls createRoom to obtain a room code and the
 * initial player list, then polls getRoom every second to keep the
 * player list up to date. It shows how many players are ready, lets the
 * host copy the room code to the clipboard (with a toast confirmation),
 * and starts the game once every player is ready or is the host, which
 * calls startRoom, shows a toast, and after a short delay navigates to
 * /input.
 *
 * react router, the room API, the shared UI kit, and PlayerList are all
 * mocked so tests can control the data HostingPage receives and assert
 * on its resulting behaviour without depending on real network calls or
 * styling.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import HostingPage from '../client/src/pages/HostingPage'

const {
  mockNavigate,
  mockUseLocation,
  mockCreateRoom,
  mockGetRoom,
  mockStartRoom,
  mockShow,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseLocation: vi.fn(),
  mockCreateRoom: vi.fn(),
  mockGetRoom: vi.fn(),
  mockStartRoom: vi.fn(),
  mockShow: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
}))

vi.mock('../client/src/api/room', () => ({
  createRoom: mockCreateRoom,
  getRoom: mockGetRoom,
  startRoom: mockStartRoom,
}))

// Shared UI kit reduced to simple, inspectable markup. useToast is
// reduced to just a show spy so tests can assert on what message it was
// called with, without needing the mock toast element to be reactive.
vi.mock('../client/src/components/ui', () => ({
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode
    onClick?: () => void
    disabled?: boolean
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  useToast: () => ({ toast: null, show: mockShow }),
}))

vi.mock('../client/src/components/PlayerList', () => ({
  default: ({ players }: { players: Array<{ name: string }> }) => (
    <ul data-testid="player-list">
      {players.map((p) => (
        <li key={p.name}>{p.name}</li>
      ))}
    </ul>
  ),
}))

function makePlayers(overrides: Array<Partial<{
  name: string
  isHost: boolean
  ready: boolean
}>> = []) {
  const base = [
    { name: 'Ash', status: 'host', isHost: true, ready: true, joinedAt: 1 },
    { name: 'Sam', status: 'waiting', isHost: false, ready: false, joinedAt: 2 },
  ]
  return overrides.length
    ? overrides.map((o, i) => ({ ...base[i % base.length], ...o }))
    : base
}

describe('HostingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockUseLocation.mockReturnValue({ state: { playerName: 'Ash' } })
    mockCreateRoom.mockResolvedValue({
      success: true,
      roomCode: 'ABC123',
      room: { players: makePlayers() },
    })
    mockGetRoom.mockResolvedValue({
      success: true,
      room: { players: makePlayers() },
    })
    mockStartRoom.mockResolvedValue({ success: true })

    // jsdom does not implement clipboard by default.
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('redirects to the home page when no host name is present', () => {
    mockUseLocation.mockReturnValue({ state: {} })

    render(<HostingPage />)

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  test('creates the room on mount and renders the returned players', async () => {
    render(<HostingPage />)

    await waitFor(() => {
      expect(mockCreateRoom).toHaveBeenCalledWith('Ash')
    })
    expect(screen.getByText('Ash')).toBeInTheDocument()
    expect(screen.getByText('Sam')).toBeInTheDocument()
  })

  test('shows the player count out of the max', async () => {
    render(<HostingPage />)

    await waitFor(() => {
      expect(screen.getByText('PLAYERS 2/4')).toBeInTheDocument()
    })
  })

  test('shows the ready count, counting the host as always ready', async () => {
    render(<HostingPage />)

    await waitFor(() => {
      // Ash is host (counts as ready), Sam is not ready: 1/2 ready.
      expect(screen.getByText('1/2 ready')).toBeInTheDocument()
    })
  })

  test('polls getRoom on an interval once the room code is known', async () => {
    render(<HostingPage />)

    await waitFor(() => expect(mockCreateRoom).toHaveBeenCalledTimes(1))

    await vi.advanceTimersByTimeAsync(1000)
    await waitFor(() => expect(mockGetRoom).toHaveBeenCalledWith('ABC123'))
  })

  test('the start button is disabled and shows a waiting label when not all players are ready', async () => {
    render(<HostingPage />)

    await waitFor(() => {
      expect(screen.getByText('Waiting for Players')).toBeDisabled()
    })
  })

  test('the start button becomes enabled and shows Start Game once every player is ready', async () => {
    mockCreateRoom.mockResolvedValue({
      success: true,
      roomCode: 'ABC123',
      room: { players: makePlayers([{ name: 'Ash', isHost: true, ready: true }, { name: 'Sam', isHost: false, ready: true }]) },
    })

    render(<HostingPage />)

    await waitFor(() => {
      expect(screen.getByText('Start Game')).not.toBeDisabled()
    })
  })

  test('copying the room code writes it to the clipboard and shows a toast', async () => {
    render(<HostingPage />)
    await waitFor(() => expect(mockCreateRoom).toHaveBeenCalled())

    fireEvent.click(screen.getByText('Copy Room Code'))

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC123')
    expect(mockShow).toHaveBeenCalledWith('Invite code copied!')
  })

  test('starting the game calls startRoom, shows a toast, and navigates to input after the delay', async () => {
    mockCreateRoom.mockResolvedValue({
      success: true,
      roomCode: 'ABC123',
      room: { players: makePlayers([{ name: 'Ash', isHost: true, ready: true }, { name: 'Sam', isHost: false, ready: true }]) },
    })

    render(<HostingPage />)
    await waitFor(() => expect(screen.getByText('Start Game')).not.toBeDisabled())

    fireEvent.click(screen.getByText('Start Game'))

    await waitFor(() => {
      expect(mockStartRoom).toHaveBeenCalledWith('ABC123')
    })
    expect(mockShow).toHaveBeenCalledWith('Starting game...')

    expect(mockNavigate).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1200)

    expect(mockNavigate).toHaveBeenCalledWith('/input', {
      state: { roomCode: 'ABC123', playerName: 'Ash' },
    })
  })

  test('starting the game does nothing when not all players are ready', async () => {
    render(<HostingPage />)
    await waitFor(() => expect(mockCreateRoom).toHaveBeenCalled())

    // The button is disabled, so simulate a direct click attempt anyway to
    // confirm the guard inside handleStart itself, not just the disabled
    // attribute.
    fireEvent.click(screen.getByText('Waiting for Players'))

    expect(mockStartRoom).not.toHaveBeenCalled()
  })

  test('renders the gamemode selector', async () => {
    render(<HostingPage />)
    await waitFor(() => expect(mockCreateRoom).toHaveBeenCalled())

    expect(screen.getByText('Classic')).toBeInTheDocument()
  })
})