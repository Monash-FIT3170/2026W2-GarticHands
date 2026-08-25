/**
 * InputPage.test.tsx
 *
 * Component tests for InputPage (client/src/pages/InputPage).
 *
 * InputPage is the first round screen where a player types the prompt
 * that another player will later draw. Submitting posts the prompt,
 * disables further input, and shows a waiting message until the room
 * moves into the draw phase, at which point the page navigates to
 * /draw. If the countdown expires before the player submits, it auto
 * submits whatever prompt has been typed so far.
 *
 * Unlike GuessingPage, the Submit button here is only disabled once
 * submitted is true, not based on whether the input is blank; the blank
 * check happens inside handleSubmit itself, so clicking Submit with an
 * empty input is a safe no op rather than a disabled button state.
 *
 * react router, the room API, and the shared UI kit are all mocked so
 * tests can control what data InputPage receives and assert on its
 * resulting behaviour directly.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import InputPage from '../client/src/pages/InputPage'

type LocationState = {
  state?: { roomCode?: string; playerName?: string }
}

const {
  mockNavigate,
  mockUseLocation,
  mockSubmitPrompt,
  mockUsePhaseAdvance,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseLocation: vi.fn<() => LocationState>(),
  mockSubmitPrompt: vi.fn(),
  mockUsePhaseAdvance: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useLocation: () => mockUseLocation(),
  useNavigate: () => mockNavigate,
}))

vi.mock('../client/src/api/room', () => ({
  submitPrompt: mockSubmitPrompt,
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

describe('InputPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLocation.mockReturnValue({
      state: { roomCode: 'ABC123', playerName: 'Ash' },
    })
    mockUsePhaseAdvance.mockReturnValue({
      waitingFor: 0,
      room: { round: 1, maxRounds: 4 },
    })
    mockSubmitPrompt.mockResolvedValue({ success: true, room: { phase: 'prompt' } })
  })

  test('redirects to the home page when roomCode is missing', () => {
    mockUseLocation.mockReturnValue({ state: { playerName: 'Ash' } })

    render(<InputPage />)

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  test('redirects to the home page when playerName is missing', () => {
    mockUseLocation.mockReturnValue({ state: { roomCode: 'ABC123' } })

    render(<InputPage />)

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  test('renders the round header using the phase advance room data', () => {
    render(<InputPage />)

    expect(screen.getByText('Round 1 of 4')).toBeInTheDocument()
  })

  test('the submit button starts enabled', () => {
    render(<InputPage />)

    expect(screen.getByText('Submit')).not.toBeDisabled()
  })

  test('clicking submit with a blank input does not call submitPrompt', () => {
    render(<InputPage />)

    fireEvent.click(screen.getByText('Submit'))

    expect(mockSubmitPrompt).not.toHaveBeenCalled()
  })

  test('clicking submit with a whitespace only input does not call submitPrompt', () => {
    render(<InputPage />)

    fireEvent.change(screen.getByPlaceholderText('Start typing your prompt here...'), {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByText('Submit'))

    expect(mockSubmitPrompt).not.toHaveBeenCalled()
  })

  test('submitting sends the trimmed prompt and disables the input', async () => {
    render(<InputPage />)

    fireEvent.change(screen.getByPlaceholderText('Start typing your prompt here...'), {
      target: { value: '  a flying cat  ' },
    })
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(mockSubmitPrompt).toHaveBeenCalledWith('ABC123', 'Ash', 'a flying cat')
    })
    expect(screen.getByPlaceholderText('Start typing your prompt here...')).toBeDisabled()
    expect(screen.getByText('Submit')).toBeDisabled()
  })

  test('navigates to draw once the submission moves the room into the draw phase', async () => {
    mockSubmitPrompt.mockResolvedValue({
      success: true,
      room: { phase: 'draw' },
    })

    render(<InputPage />)

    fireEvent.change(screen.getByPlaceholderText('Start typing your prompt here...'), {
      target: { value: 'a flying cat' },
    })
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/draw', {
        state: { roomCode: 'ABC123', playerName: 'Ash' },
      })
    })
  })

  test('shows the submission error and re enables the form when submitPrompt fails', async () => {
    mockSubmitPrompt.mockResolvedValue({
      success: false,
      message: 'Room is full.',
    })

    render(<InputPage />)

    fireEvent.change(screen.getByPlaceholderText('Start typing your prompt here...'), {
      target: { value: 'a flying cat' },
    })
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(screen.getByText('Room is full.')).toBeInTheDocument()
    })
    expect(screen.getByText('Submit')).not.toBeDisabled()
    expect(screen.getByPlaceholderText('Start typing your prompt here...')).not.toBeDisabled()
  })

  test('shows a waiting message with correct pluralisation after submitting', async () => {
    mockUsePhaseAdvance.mockReturnValue({
      waitingFor: 3,
      room: { round: 1, maxRounds: 4 },
    })

    render(<InputPage />)

    fireEvent.change(screen.getByPlaceholderText('Start typing your prompt here...'), {
      target: { value: 'a flying cat' },
    })
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(screen.getByText('Waiting for 3 other players...')).toBeInTheDocument()
    })
  })

  test('shows the singular form of the waiting message when exactly one player remains', async () => {
    mockUsePhaseAdvance.mockReturnValue({
      waitingFor: 1,
      room: { round: 1, maxRounds: 4 },
    })

    render(<InputPage />)

    fireEvent.change(screen.getByPlaceholderText('Start typing your prompt here...'), {
      target: { value: 'a flying cat' },
    })
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(screen.getByText('Waiting for 1 other player...')).toBeInTheDocument()
    })
  })

  test('shows the starting message once nobody else is waited on', async () => {
    mockUsePhaseAdvance.mockReturnValue({
      waitingFor: 0,
      room: { round: 1, maxRounds: 4 },
    })

    render(<InputPage />)

    fireEvent.change(screen.getByPlaceholderText('Start typing your prompt here...'), {
      target: { value: 'a flying cat' },
    })
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(screen.getByText('Starting drawing phase...')).toBeInTheDocument()
    })
  })

  test('the timer expiring auto submits the typed prompt', async () => {
    render(<InputPage />)

    fireEvent.change(screen.getByPlaceholderText('Start typing your prompt here...'), {
      target: { value: 'a flying cat' },
    })
    fireEvent.click(screen.getByTestId('expire-timer'))

    await waitFor(() => {
      expect(mockSubmitPrompt).toHaveBeenCalledWith('ABC123', 'Ash', 'a flying cat')
    })
  })

  test('the timer expiring with a blank input does not submit', () => {
    render(<InputPage />)

    fireEvent.click(screen.getByTestId('expire-timer'))

    expect(mockSubmitPrompt).not.toHaveBeenCalled()
  })

  test('the timer expiring after submission does not submit again', async () => {
    render(<InputPage />)

    fireEvent.change(screen.getByPlaceholderText('Start typing your prompt here...'), {
      target: { value: 'a flying cat' },
    })
    fireEvent.click(screen.getByText('Submit'))
    await waitFor(() => expect(mockSubmitPrompt).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByTestId('expire-timer'))

    expect(mockSubmitPrompt).toHaveBeenCalledTimes(1)
  })

  test('limits the prompt input to the configured maximum length', () => {
    render(<InputPage />)

    expect(screen.getByPlaceholderText('Start typing your prompt here...')).toHaveAttribute(
      'maxLength',
      '120',
    )
  })
})