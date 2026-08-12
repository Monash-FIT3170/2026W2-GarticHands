/**
 * GamePage.test.tsx
 *
 * Component tests for GamePage (client/src/pages/GamePage).
 *
 * GamePage is the end of round reveal screen. On mount it polls getRoom
 * every 1.5s, redirecting to /input if the room has moved into the prompt
 * phase (next round started) or /joined/:roomCode if it has moved back to
 * the lobby. While a room is loaded it builds one reveal chain per player
 * (their prompt, their drawing, and the guess made about it by the
 * previous player in turn order) and renders one of three views: reveal
 * cards, a slideshow, or the local player's recordings. The host sees a
 * Play Round N+1 or Back to Lobby button depending on whether the current
 * round is the final one; non hosts see a waiting message instead.
 *
 * react-router-dom, the room API, RecordingsContext, and the shared UI
 * kit are all mocked so tests can control exactly what data GamePage
 * receives and assert on its resulting behaviour, rather than depending
 * on real routing, network calls, or styling.
 */

import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import GamePage from '../client/src/pages/GamePage'

const {
  mockNavigate,
  mockUseLocation,
  mockGetRoom,
  mockRestartRoom,
  mockEndRoom,
  mockClearRecordings,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseLocation: vi.fn(),
  mockGetRoom: vi.fn(),
  mockRestartRoom: vi.fn(),
  mockEndRoom: vi.fn(),
  mockClearRecordings: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useLocation: () => mockUseLocation(),
  useNavigate: () => mockNavigate,
}))

vi.mock('../client/src/api/room', () => ({
  getRoom: mockGetRoom,
  restartRoom: mockRestartRoom,
  endRoom: mockEndRoom,
}))

// recordings starts empty by default; individual tests override via
// mockUseRecordings below when they need fixture recordings.
const mockUseRecordings = vi.fn(() => ({
  recordings: [] as Array<{
    round: number
    blobUrl: string
    prompt?: string
    createdAt: number
  }>,
  clearRecordings: mockClearRecordings,
}))

vi.mock('../client/src/state/RecordingsContext', () => ({
  useRecordings: () => mockUseRecordings(),
}))

// Shared UI kit reduced to simple, inspectable markup.
vi.mock('../client/src/components/ui', () => ({
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
  RoundHeader: ({ round, totalRounds }: { round: number; totalRounds: number }) => (
    <p>
      Round {round} of {totalRounds}
    </p>
  ),
}))

// Three-player fixture room, mid-game (round 2 of 4), each with a prompt,
// a drawing, and a guess made about the previous player's drawing 
// matching the "player i's drawing is guessed by player i-1" cycle.
function makeRoom(overrides: Partial<{
  round: number
  maxRounds: number
  phase: string
}> = {}) {
  return {
    code: 'ABC123',
    players: [
      { name: 'Ash', status: 'host', isHost: true, ready: true, joinedAt: 1 },
      { name: 'Sam', status: 'ready', isHost: false, ready: true, joinedAt: 2 },
      { name: 'Alex', status: 'ready', isHost: false, ready: true, joinedAt: 3 },
    ],
    status: 'started',
    phase: overrides.phase ?? 'reveal',
    round: overrides.round ?? 2,
    maxRounds: overrides.maxRounds ?? 4,
    prompts: { Ash: 'a flying cat', Sam: 'a sad robot', Alex: 'a tiny house' },
    drawings: { Ash: 'data:image/png;base64,ash', Sam: 'data:image/png;base64,sam', Alex: 'data:image/png;base64,alex' },
    guesses: { Ash: 'a house', Sam: 'a cat', Alex: 'a robot' },
    createdAt: 1,
  }
}

describe('GamePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockUseLocation.mockReturnValue({
      state: { roomCode: 'ABC123', playerName: 'Ash' },
    })
    mockUseRecordings.mockReturnValue({
      recordings: [],
      clearRecordings: mockClearRecordings,
    })
    mockGetRoom.mockResolvedValue({ success: true, room: makeRoom() })
    mockRestartRoom.mockResolvedValue({ success: true })
    mockEndRoom.mockResolvedValue({ success: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('redirects to the home page when roomCode is missing', () => {
    mockUseLocation.mockReturnValue({ state: { playerName: 'Ash' } })

    render(<GamePage />)

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  test('shows a loading message before the room has loaded', () => {
    render(<GamePage />)

    expect(screen.getByText('Loading results...')).toBeInTheDocument()
  })

  test('redirects to /input when the polled room has moved into the prompt phase', async () => {
    mockGetRoom.mockResolvedValue({ success: true, room: makeRoom({ phase: 'prompt' }) })

    render(<GamePage />)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/input', {
        state: { roomCode: 'ABC123', playerName: 'Ash' },
      })
    })
  })

  test('redirects to the joined lobby when the polled room has moved back to lobby phase', async () => {
    mockGetRoom.mockResolvedValue({ success: true, room: makeRoom({ phase: 'lobby' }) })

    render(<GamePage />)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/joined/ABC123', {
        state: { roomCode: 'ABC123', playerName: 'Ash' },
      })
    })
  })

  test('renders the round header once the room has loaded', async () => {
    render(<GamePage />)

    await waitFor(() => {
      expect(screen.getByText('Round 2 of 4')).toBeInTheDocument()
    })
  })

  test('polls getRoom repeatedly on the configured interval', async () => {
    render(<GamePage />)

    await waitFor(() => expect(mockGetRoom).toHaveBeenCalledTimes(1))

    await vi.advanceTimersByTimeAsync(1500)
    await waitFor(() => expect(mockGetRoom).toHaveBeenCalledTimes(2))

    await vi.advanceTimersByTimeAsync(1500)
    await waitFor(() => expect(mockGetRoom).toHaveBeenCalledTimes(3))
  })

  describe('cards view (default)', () => {
    test('renders a reveal chain for every player', async () => {
      render(<GamePage />)

      await waitFor(() => screen.getByText('Round 2 of 4'))

      expect(screen.getByText('"a flying cat"')).toBeInTheDocument()
      expect(screen.getByText('"a sad robot"')).toBeInTheDocument()
      expect(screen.getByText('"a tiny house"')).toBeInTheDocument()
    })

    test('shows the guesser and their guess for each chain', async () => {
      render(<GamePage />)

      await waitFor(() => screen.getByText('Round 2 of 4'))

      // Ash's drawing (index 0) is guessed by the last player, Alex.
      expect(screen.getByText('"a house"')).toBeInTheDocument()
    })

    test('shows a placeholder image when a drawing was not submitted', async () => {
      mockGetRoom.mockResolvedValue({
        success: true,
        room: { ...makeRoom(), drawings: {} },
      })

      render(<GamePage />)

      await waitFor(() => screen.getByText('Round 2 of 4'))

      expect(screen.getAllByText('No drawing submitted')).toHaveLength(3)
    })

    test('shows the empty state when there are no players', async () => {
      mockGetRoom.mockResolvedValue({
        success: true,
        room: { ...makeRoom(), players: [] },
      })

      render(<GamePage />)

      await waitFor(() => {
        expect(screen.getByText('No drawings to reveal.')).toBeInTheDocument()
      })
    })
  })

  describe('view switching', () => {
    test('switches to the slideshow view when its tab is clicked', async () => {
      render(<GamePage />)

      await waitFor(() => screen.getByText('Round 2 of 4'))

      fireEvent.click(screen.getByText('Slideshow'))

      // Slideshow shows a single current chain with prev/pause/next controls.
      expect(screen.getByText('Pause')).toBeInTheDocument()
    })

    test('switches to the recordings view when its tab is clicked', async () => {
      render(<GamePage />)

      await waitFor(() => screen.getByText('Round 2 of 4'))

      fireEvent.click(screen.getByText(/My Recordings/))

      expect(
        screen.getByText(/No recordings yet/),
      ).toBeInTheDocument()
    })

    test('the recordings tab label includes the current recordings count', async () => {
      mockUseRecordings.mockReturnValue({
        recordings: [
          { round: 1, blobUrl: 'blob:a', prompt: 'x', createdAt: 1 },
          { round: 2, blobUrl: 'blob:b', prompt: 'y', createdAt: 2 },
        ],
        clearRecordings: mockClearRecordings,
      })

      render(<GamePage />)

      await waitFor(() => screen.getByText('Round 2 of 4'))

      expect(screen.getByText('My Recordings (2)')).toBeInTheDocument()
    })
  })

  describe('slideshow view', () => {
    test('shows a no drawings message when no chains have a drawing', async () => {
      mockGetRoom.mockResolvedValue({
        success: true,
        room: { ...makeRoom(), drawings: {} },
      })

      render(<GamePage />)
      await waitFor(() => screen.getByText('Round 2 of 4'))
      fireEvent.click(screen.getByText('Slideshow'))

      expect(
        screen.getByText('No drawings were submitted this round.'),
      ).toBeInTheDocument()
    })

    test('advances to the next slide when Next is clicked', async () => {
      render(<GamePage />)
      await waitFor(() => screen.getByText('Round 2 of 4'))
      fireEvent.click(screen.getByText('Slideshow'))

      expect(screen.getByText('1 / 3')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Next'))

      expect(screen.getByText('2 / 3')).toBeInTheDocument()
    })

    test('wraps back to the first slide from the last via Next', async () => {
      render(<GamePage />)
      await waitFor(() => screen.getByText('Round 2 of 4'))
      fireEvent.click(screen.getByText('Slideshow'))

      fireEvent.click(screen.getByText('Next'))
      fireEvent.click(screen.getByText('Next'))
      expect(screen.getByText('3 / 3')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Next'))
      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })

    test('goes to the previous slide, wrapping to the last from the first', async () => {
      render(<GamePage />)
      await waitFor(() => screen.getByText('Round 2 of 4'))
      fireEvent.click(screen.getByText('Slideshow'))

      fireEvent.click(screen.getByText('Prev'))

      expect(screen.getByText('3 / 3')).toBeInTheDocument()
    })

    test('toggles the play/pause label when clicked', async () => {
      render(<GamePage />)
      await waitFor(() => screen.getByText('Round 2 of 4'))
      fireEvent.click(screen.getByText('Slideshow'))

      fireEvent.click(screen.getByText('Pause'))
      expect(screen.getByText('Play')).toBeInTheDocument()
    })

    test('auto-advances on the slide interval while playing', async () => {
      render(<GamePage />)
      await waitFor(() => screen.getByText('Round 2 of 4'))
      fireEvent.click(screen.getByText('Slideshow'))

      expect(screen.getByText('1 / 3')).toBeInTheDocument()

      await vi.advanceTimersByTimeAsync(4000)

      expect(screen.getByText('2 / 3')).toBeInTheDocument()
    })

    test('does not auto-advance once paused', async () => {
      render(<GamePage />)
      await waitFor(() => screen.getByText('Round 2 of 4'))
      fireEvent.click(screen.getByText('Slideshow'))

      fireEvent.click(screen.getByText('Pause'))

      await vi.advanceTimersByTimeAsync(4000)

      expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })
  })

  describe('recordings view', () => {
    test('shows the current recording round and prompt', async () => {
      mockUseRecordings.mockReturnValue({
        recordings: [
          { round: 1, blobUrl: 'blob:a', prompt: 'a flying cat', createdAt: 1 },
        ],
        clearRecordings: mockClearRecordings,
      })

      render(<GamePage />)
      await waitFor(() => screen.getByText('Round 2 of 4'))
      fireEvent.click(screen.getByText(/My Recordings/))

      expect(screen.getByText('Round 1 · "a flying cat"')).toBeInTheDocument()
    })

    test('sorts recordings by round before display', async () => {
      mockUseRecordings.mockReturnValue({
        recordings: [
          { round: 3, blobUrl: 'blob:c', prompt: 'third', createdAt: 3 },
          { round: 1, blobUrl: 'blob:a', prompt: 'first', createdAt: 1 },
        ],
        clearRecordings: mockClearRecordings,
      })

      render(<GamePage />)
      await waitFor(() => screen.getByText('Round 2 of 4'))
      fireEvent.click(screen.getByText(/My Recordings/))

      // Lowest round should be shown first, regardless of array order.
      expect(screen.getByText('Round 1 · "first"')).toBeInTheDocument()
    })

    test('advances to the next recording when its video ends', async () => {
      mockUseRecordings.mockReturnValue({
        recordings: [
          { round: 1, blobUrl: 'blob:a', prompt: 'first', createdAt: 1 },
          { round: 2, blobUrl: 'blob:b', prompt: 'second', createdAt: 2 },
        ],
        clearRecordings: mockClearRecordings,
      })

      render(<GamePage />)
      await waitFor(() => screen.getByText('Round 2 of 4'))
      fireEvent.click(screen.getByText(/My Recordings/))

      const video = document.querySelector('video')
      expect(video).not.toBeNull()
      fireEvent.ended(video as HTMLVideoElement)

      expect(screen.getByText('Round 2 · "second"')).toBeInTheDocument()
    })

    test('Prev is disabled on the first recording, Next is disabled on the last', async () => {
      mockUseRecordings.mockReturnValue({
        recordings: [{ round: 1, blobUrl: 'blob:a', prompt: 'only', createdAt: 1 }],
        clearRecordings: mockClearRecordings,
      })

      render(<GamePage />)
      await waitFor(() => screen.getByText('Round 2 of 4'))
      fireEvent.click(screen.getByText(/My Recordings/))

      expect(screen.getByText('Prev')).toBeDisabled()
      expect(screen.getByText('Next')).toBeDisabled()
    })
  })

  describe('host controls', () => {
    test('host sees a Play Round button when not on the final round', async () => {
      render(<GamePage />)

      await waitFor(() => {
        expect(screen.getByText('Play Round 3')).toBeInTheDocument()
      })
    })

    test('host sees a Back to Lobby button on the final round', async () => {
      mockGetRoom.mockResolvedValue({
        success: true,
        room: makeRoom({ round: 4, maxRounds: 4 }),
      })

      render(<GamePage />)

      await waitFor(() => {
        expect(screen.getByText('Back to Lobby')).toBeInTheDocument()
      })
    })

    test('clicking Play Round calls restartRoom', async () => {
      render(<GamePage />)
      await waitFor(() => screen.getByText('Play Round 3'))

      fireEvent.click(screen.getByText('Play Round 3'))

      await waitFor(() => {
        expect(mockRestartRoom).toHaveBeenCalledWith('ABC123')
      })
    })

    test('clicking Back to Lobby clears recordings and calls endRoom', async () => {
      mockGetRoom.mockResolvedValue({
        success: true,
        room: makeRoom({ round: 4, maxRounds: 4 }),
      })

      render(<GamePage />)
      await waitFor(() => screen.getByText('Back to Lobby'))

      fireEvent.click(screen.getByText('Back to Lobby'))

      expect(mockClearRecordings).toHaveBeenCalledTimes(1)
      await waitFor(() => {
        expect(mockEndRoom).toHaveBeenCalledWith('ABC123')
      })
    })

    test('non-host players see a waiting message instead of action buttons', async () => {
      mockUseLocation.mockReturnValue({
        state: { roomCode: 'ABC123', playerName: 'Sam' },
      })

      render(<GamePage />)

      await waitFor(() => {
        expect(
          screen.getByText('Waiting for the host to start the next round...'),
        ).toBeInTheDocument()
      })
      expect(screen.queryByText(/Play Round/)).not.toBeInTheDocument()
    })

    test('non-host players see a lobby-specific waiting message on the final round', async () => {
      mockUseLocation.mockReturnValue({
        state: { roomCode: 'ABC123', playerName: 'Sam' },
      })
      mockGetRoom.mockResolvedValue({
        success: true,
        room: makeRoom({ round: 4, maxRounds: 4 }),
      })

      render(<GamePage />)

      await waitFor(() => {
        expect(
          screen.getByText('Waiting for the host to return to the lobby...'),
        ).toBeInTheDocument()
      })
    })
  })
})