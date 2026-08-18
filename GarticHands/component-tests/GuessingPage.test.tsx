/**
 * GuessingPage.test.tsx
 *
 * Component tests for GuessingPage (client/src/pages/GuessingPage).
 *
 * GuessingPage shows the player a drawing made by the next player in the
 * player list (determined once, on mount, by fetching the room) and lets
 * them type a guess for what it depicts. Submitting posts the guess,
 * disables further input, and shows a waiting message until the room
 * moves into the reveal phase, at which point the page navigates to
 * /game. If the countdown expires first, it auto submits whatever guess
 * has been typed, or an empty guess if none was typed.
 *
 * react router, the room API, and the shared UI kit are all mocked so
 * tests can control what data GuessingPage receives and assert on its
 * resulting behaviour directly.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import GuessingPage from '../client/src/pages/GuessingPage'

const {
  mockNavigate,
  mockUseLocation,
  mockGetRoom,
  mockSubmitGuess,
  mockUsePhaseAdvance,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseLocation: vi.fn(),
  mockGetRoom: vi.fn(),
  mockSubmitGuess: vi.fn(),
  mockUsePhaseAdvance: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useLocation: () => mockUseLocation(),
  useNavigate: () => mockNavigate,
}))

vi.mock('../client/src/api/room', () => ({
  getRoom: mockGetRoom,
  submitGuess: mockSubmitGuess,
}))

vi.mock('../client/src/hooks/usePhaseAdvance', () => ({
  usePhaseAdvance: mockUsePhaseAdvance,
}))

// Shared UI kit reduced to simple, inspectable markup. CountdownTimer is
// reduced to a clickable stand in so its onExpire callback can be
// triggered directly from a test.
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
  CountdownTimer: ({ onExpire }: { onExpire?: () => void }) => (
    <button data-testid="expire-timer" onClick={onExpire}>
      expire
    </button>
  ),
}))

// Three player fixture room used across most tests. From Ash's point of
// view, the next player in the list is Sam, so Ash should be shown Sam's
// drawing.
function makeRoomResponse() {
  return {
    success: true as const,
    room: {
      code: 'ABC123',
      players: [
        { name: 'Ash', status: 'ready', isHost: true, ready: true, joinedAt: 1 },
        { name: 'Sam', status: 'ready', isHost: false, ready: true, joinedAt: 2 },
        { name: 'Alex', status: 'ready', isHost: false, ready: true, joinedAt: 3 },
      ],
      status: 'started',
      phase: 'guess',
      round: 1,
      maxRounds: 4,
      prompts: {},
      drawings: { Sam: 'data:image/png;base64,samdrawing' },
      guesses: {},
      createdAt: 1,
    },
  }
}

describe('GuessingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLocation.mockReturnValue({
      state: { roomCode: 'ABC123', playerName: 'Ash' },
    })
    mockGetRoom.mockResolvedValue(makeRoomResponse())
    mockUsePhaseAdvance.mockReturnValue({
      waitingFor: 0,
      room: makeRoomResponse().room,
    })
    mockSubmitGuess.mockResolvedValue({ success: true, room: { phase: 'guess' } })
  })

  test('redirects to the home page when roomCode is missing', () => {
    mockUseLocation.mockReturnValue({ state: { playerName: 'Ash' } })

    render(<GuessingPage />)

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  test('redirects to the home page when playerName is missing', () => {
    mockUseLocation.mockReturnValue({ state: { roomCode: 'ABC123' } })

    render(<GuessingPage />)

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  test('shows a loading placeholder before the drawing has loaded', () => {
    render(<GuessingPage />)

    expect(screen.getByText('Loading drawing...')).toBeInTheDocument()
  })

  test('loads the drawing made by the next player after the current player', async () => {
    render(<GuessingPage />)

    await waitFor(() => {
      expect(screen.getByText('Drawn by Sam')).toBeInTheDocument()
    })
    expect(screen.getByAltText('Drawing by Sam')).toHaveAttribute(
      'src',
      'data:image/png;base64,samdrawing',
    )
  })

  test('wraps around the player list when the current player is last', async () => {
    mockUseLocation.mockReturnValue({
      state: { roomCode: 'ABC123', playerName: 'Alex' },
    })

    render(<GuessingPage />)

    await waitFor(() => {
      expect(screen.getByText('Drawn by Ash')).toBeInTheDocument()
    })
  })

  test('submit is disabled until a guess is typed', async () => {
    render(<GuessingPage />)
    await waitFor(() => screen.getByText('Drawn by Sam'))

    expect(screen.getByText('Submit Guess')).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('What is this drawing?'), {
      target: { value: 'a robot' },
    })

    expect(screen.getByText('Submit Guess')).not.toBeDisabled()
  })

  test('submit is disabled when the guess is only whitespace', async () => {
    render(<GuessingPage />)
    await waitFor(() => screen.getByText('Drawn by Sam'))

    fireEvent.change(screen.getByPlaceholderText('What is this drawing?'), {
      target: { value: '   ' },
    })

    expect(screen.getByText('Submit Guess')).toBeDisabled()
  })

  test('submitting sends the trimmed guess and disables the input', async () => {
    render(<GuessingPage />)
    await waitFor(() => screen.getByText('Drawn by Sam'))

    fireEvent.change(screen.getByPlaceholderText('What is this drawing?'), {
      target: { value: '  a robot  ' },
    })
    fireEvent.click(screen.getByText('Submit Guess'))

    await waitFor(() => {
      expect(mockSubmitGuess).toHaveBeenCalledWith('ABC123', 'Ash', 'a robot')
    })
    expect(screen.getByPlaceholderText('What is this drawing?')).toBeDisabled()
  })

  test('navigates to /game once the submission moves the room into the reveal phase', async () => {
    mockSubmitGuess.mockResolvedValue({
      success: true,
      room: { phase: 'reveal' },
    })

    render(<GuessingPage />)
    await waitFor(() => screen.getByText('Drawn by Sam'))

    fireEvent.change(screen.getByPlaceholderText('What is this drawing?'), {
      target: { value: 'a robot' },
    })
    fireEvent.click(screen.getByText('Submit Guess'))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/game', {
        state: { roomCode: 'ABC123', playerName: 'Ash' },
      })
    })
  })

  test('shows the submission error and re enables the form when submitGuess fails', async () => {
    mockSubmitGuess.mockResolvedValue({
      success: false,
      message: 'Room is full.',
    })

    render(<GuessingPage />)
    await waitFor(() => screen.getByText('Drawn by Sam'))

    fireEvent.change(screen.getByPlaceholderText('What is this drawing?'), {
      target: { value: 'a robot' },
    })
    fireEvent.click(screen.getByText('Submit Guess'))

    await waitFor(() => {
      expect(screen.getByText('Room is full.')).toBeInTheDocument()
    })
    expect(screen.getByText('Submit Guess')).not.toBeDisabled()
    expect(screen.getByPlaceholderText('What is this drawing?')).not.toBeDisabled()
  })

  test('shows a waiting message with correct pluralisation after submitting', async () => {
    mockUsePhaseAdvance.mockReturnValue({
      waitingFor: 2,
      room: makeRoomResponse().room,
    })

    render(<GuessingPage />)
    await waitFor(() => screen.getByText('Drawn by Sam'))

    fireEvent.change(screen.getByPlaceholderText('What is this drawing?'), {
      target: { value: 'a robot' },
    })
    fireEvent.click(screen.getByText('Submit Guess'))

    await waitFor(() => {
      expect(screen.getByText('Waiting for 2 other players...')).toBeInTheDocument()
    })
  })

  test('shows the revealing message once nobody else is waited on', async () => {
    mockUsePhaseAdvance.mockReturnValue({
      waitingFor: 0,
      room: makeRoomResponse().room,
    })

    render(<GuessingPage />)
    await waitFor(() => screen.getByText('Drawn by Sam'))

    fireEvent.change(screen.getByPlaceholderText('What is this drawing?'), {
      target: { value: 'a robot' },
    })
    fireEvent.click(screen.getByText('Submit Guess'))

    await waitFor(() => {
      expect(screen.getByText('Revealing results...')).toBeInTheDocument()
    })
  })

  test('the timer expiring auto submits the typed guess', async () => {
    render(<GuessingPage />)
    await waitFor(() => screen.getByText('Drawn by Sam'))

    fireEvent.change(screen.getByPlaceholderText('What is this drawing?'), {
      target: { value: 'a robot' },
    })
    fireEvent.click(screen.getByTestId('expire-timer'))

    await waitFor(() => {
      expect(mockSubmitGuess).toHaveBeenCalledWith('ABC123', 'Ash', 'a robot')
    })
  })

  test('the timer expiring with no typed guess auto submits an empty guess', async () => {
    render(<GuessingPage />)
    await waitFor(() => screen.getByText('Drawn by Sam'))

    fireEvent.click(screen.getByTestId('expire-timer'))

    await waitFor(() => {
      expect(mockSubmitGuess).toHaveBeenCalledWith('ABC123', 'Ash', '')
    })
  })

  test('the timer expiring after submission does not submit again', async () => {
    render(<GuessingPage />)
    await waitFor(() => screen.getByText('Drawn by Sam'))

    fireEvent.change(screen.getByPlaceholderText('What is this drawing?'), {
      target: { value: 'a robot' },
    })
    fireEvent.click(screen.getByText('Submit Guess'))
    await waitFor(() => expect(mockSubmitGuess).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByTestId('expire-timer'))

    expect(mockSubmitGuess).toHaveBeenCalledTimes(1)
  })

  test('limits the guess input to the configured maximum length', async () => {
    render(<GuessingPage />)
    await waitFor(() => screen.getByText('Drawn by Sam'))

    expect(screen.getByPlaceholderText('What is this drawing?')).toHaveAttribute(
      'maxLength',
      '120',
    )
  })
})