/**
 * JoiningPage.test.tsx
 *
 * Component tests for JoiningPage (client/src/pages/JoiningPage).
 *
 * JoiningPage lets a player who already entered their name join an
 * existing room by typing its code. Typing is automatically uppercased,
 * pressing Enter in the input submits the same way clicking Join Game
 * does, the Join Game button is disabled while the code is blank or a
 * request is in flight, and a successful join navigates to
 * /joined/:roomCode with the returned room and player name in the
 * navigation state.
 *
 * react router, the room API, and the shared UI kit are all mocked so
 * tests can control what data JoiningPage receives and assert on its
 * resulting behaviour directly.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import JoiningPage from '../client/src/pages/JoiningPage'

const { mockNavigate, mockUseLocation, mockJoinRoom } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseLocation: vi.fn(),
  mockJoinRoom: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
}))

vi.mock('../client/src/api/room', () => ({
  joinRoom: mockJoinRoom,
}))

// Shared UI kit reduced to simple, inspectable markup.
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
  Avatar: () => <div data-testid="avatar" />,
}))

describe('JoiningPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLocation.mockReturnValue({ state: { playerName: 'Ash' } })
  })

  test('renders the room code input and join button', () => {
    render(<JoiningPage />)

    expect(screen.getByPlaceholderText('ABC123')).toBeInTheDocument()
    expect(screen.getByText('Join Game')).toBeInTheDocument()
  })

  test('the join button starts disabled while the room code is blank', () => {
    render(<JoiningPage />)

    expect(screen.getByText('Join Game')).toBeDisabled()
  })

  test('typing a room code uppercases it', () => {
    render(<JoiningPage />)

    fireEvent.change(screen.getByPlaceholderText('ABC123'), {
      target: { value: 'abc123' },
    })

    expect(screen.getByPlaceholderText('ABC123')).toHaveValue('ABC123')
  })

  test('the join button becomes enabled once a room code is typed', () => {
    render(<JoiningPage />)

    fireEvent.change(screen.getByPlaceholderText('ABC123'), {
      target: { value: 'ABC123' },
    })

    expect(screen.getByText('Join Game')).not.toBeDisabled()
  })

  test('clicking Back navigates to the home page', () => {
    render(<JoiningPage />)

    fireEvent.click(screen.getByText('Back'))

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  test('clicking Join Game with no player name redirects to home instead of joining', () => {
    mockUseLocation.mockReturnValue({ state: {} })

    render(<JoiningPage />)

    fireEvent.change(screen.getByPlaceholderText('ABC123'), {
      target: { value: 'ABC123' },
    })
    fireEvent.click(screen.getByText('Join Game'))

    expect(mockNavigate).toHaveBeenCalledWith('/')
    expect(mockJoinRoom).not.toHaveBeenCalled()
  })

  test('joining calls joinRoom with the typed code and player name', async () => {
    mockJoinRoom.mockResolvedValue({
      success: true,
      room: { code: 'ABC123', players: [] },
    })

    render(<JoiningPage />)

    fireEvent.change(screen.getByPlaceholderText('ABC123'), {
      target: { value: 'ABC123' },
    })
    fireEvent.click(screen.getByText('Join Game'))

    await waitFor(() => {
      expect(mockJoinRoom).toHaveBeenCalledWith('ABC123', 'Ash')
    })
  })

  test('shows a joining label while the request is in flight', async () => {
    let resolveJoin: (value: unknown) => void = () => {}
    mockJoinRoom.mockReturnValue(
      new Promise((resolve) => {
        resolveJoin = resolve
      }),
    )

    render(<JoiningPage />)

    fireEvent.change(screen.getByPlaceholderText('ABC123'), {
      target: { value: 'ABC123' },
    })
    fireEvent.click(screen.getByText('Join Game'))

    expect(screen.getByText('Joining...')).toBeInTheDocument()
    expect(screen.getByText('Joining...')).toBeDisabled()

    resolveJoin({ success: true, room: { code: 'ABC123', players: [] } })
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled())
  })

  test('navigates to the joined lobby with the room and player name on success', async () => {
    const room = { code: 'ABC123', players: [{ name: 'Ash' }] }
    mockJoinRoom.mockResolvedValue({ success: true, room })

    render(<JoiningPage />)

    fireEvent.change(screen.getByPlaceholderText('ABC123'), {
      target: { value: 'ABC123' },
    })
    fireEvent.click(screen.getByText('Join Game'))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/joined/ABC123', {
        state: { room, playerName: 'Ash' },
      })
    })
  })

  test('shows the returned error message and clears the submitting state on failure', async () => {
    mockJoinRoom.mockResolvedValue({
      success: false,
      message: 'Room not found.',
    })

    render(<JoiningPage />)

    fireEvent.change(screen.getByPlaceholderText('ABC123'), {
      target: { value: 'ZZZZZZ' },
    })
    fireEvent.click(screen.getByText('Join Game'))

    await waitFor(() => {
      expect(screen.getByText('Room not found.')).toBeInTheDocument()
    })
    expect(screen.getByText('Join Game')).not.toBeDisabled()
  })

  test('falls back to a default error message when the failure has none', async () => {
    mockJoinRoom.mockResolvedValue({ success: false })

    render(<JoiningPage />)

    fireEvent.change(screen.getByPlaceholderText('ABC123'), {
      target: { value: 'ZZZZZZ' },
    })
    fireEvent.click(screen.getByText('Join Game'))

    await waitFor(() => {
      expect(screen.getByText('Room not found.')).toBeInTheDocument()
    })
  })

  test('pressing Enter in the input submits the same way as clicking Join Game', async () => {
    mockJoinRoom.mockResolvedValue({
      success: true,
      room: { code: 'ABC123', players: [] },
    })

    render(<JoiningPage />)

    const input = screen.getByPlaceholderText('ABC123')
    fireEvent.change(input, { target: { value: 'ABC123' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(mockJoinRoom).toHaveBeenCalledWith('ABC123', 'Ash')
    })
  })

  test('pressing a key other than Enter does not submit', () => {
    render(<JoiningPage />)

    const input = screen.getByPlaceholderText('ABC123')
    fireEvent.change(input, { target: { value: 'ABC123' } })
    fireEvent.keyDown(input, { key: 'a' })

    expect(mockJoinRoom).not.toHaveBeenCalled()
  })

  test('limits the room code input to the configured maximum length', () => {
    render(<JoiningPage />)

    expect(screen.getByPlaceholderText('ABC123')).toHaveAttribute('maxLength', '6')
  })
})