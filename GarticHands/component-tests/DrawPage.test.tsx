/**
 * DrawPage.test.tsx
 *
 * Component tests for DrawPage (client/src/pages/DrawPage).
 *
 * DrawPage is a fairly large orchestration page: it reads roomCode and
 * playerName from router location state, fetches the room on mount to get
 * the current prompt and round, starts a screen recording once the round
 * is known, polls for the guess phase via usePhaseAdvance once the
 * drawing is submitted, and on submit sends the drawing image plus stops
 * the recorder in parallel before optionally navigating to /guess.
 *
 * Because this page pulls in routing, the drawing module, the shared UI
 * kit, the room API, a phase-advance hook, and a recordings context, all
 * of those are mocked here. The goal is to test DrawPage own
 * orchestration logic (what it does with the data those pieces provide),
 * not the internals of any of them.
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import DrawPage from '../client/src/pages/DrawPage'

const {
  mockNavigate,
  mockUseLocation,
  mockGetDrawingImage,
  mockSetMode,
  mockRecorderStart,
  mockRecorderStop,
  mockSaveRecording,
  mockGetRoom,
  mockSubmitDrawing,
  mockUsePhaseAdvance,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseLocation: vi.fn(),
  mockGetDrawingImage: vi.fn(),
  mockSetMode: vi.fn(),
  mockRecorderStart: vi.fn(),
  mockRecorderStop: vi.fn(),
  mockSaveRecording: vi.fn(),
  mockGetRoom: vi.fn(),
  mockSubmitDrawing: vi.fn(),
  mockUsePhaseAdvance: vi.fn(),
}))

// react router: only useLocation and useNavigate are used by DrawPage.
vi.mock('react-router-dom', () => ({
  useLocation: () => mockUseLocation(),
  useNavigate: () => mockNavigate,
}))

// The drawing module: provider passes children through untouched, the
// stage/mode picker are reduced to inspectable stand ins, and the hooks
// return controllable mock values/functions.
vi.mock('../client/src/drawing', () => ({
  DrawingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DrawingStage: ({ mode }: { mode: string }) => (
    <div data-testid="drawing-stage" data-mode={mode} />
  ),
  DrawingModePicker: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="mode-picker" data-disabled={disabled ? 'true' : 'false'} />
  ),
  useDrawing: () => ({ getDrawingImage: mockGetDrawingImage }),
  useDrawingMode: () => ['split', mockSetMode],
  useRecorder: () => ({
    isSupported: true,
    start: mockRecorderStart,
    stop: mockRecorderStop,
  }),
}))

// Shared UI kit: reduced to simple, inspectable markup so tests can find
// and interact with the pieces they care about (round text, submit
// button, countdown's onExpire) without depending on real styling.
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

vi.mock('../client/src/api/room', () => ({
  getRoom: mockGetRoom,
  submitDrawing: mockSubmitDrawing,
}))

vi.mock('../client/src/hooks/usePhaseAdvance', () => ({
  usePhaseAdvance: mockUsePhaseAdvance,
}))

vi.mock('../client/src/state/RecordingsContext', () => ({
  useRecordings: () => ({ saveRecording: mockSaveRecording }),
}))

// Shared "happy path" room fixture returned by getRoom, reused across
// most tests below.
const roomFixture = {
  success: true as const,
  room: {
    code: 'ABC123',
    players: [],
    status: 'started',
    phase: 'draw',
    round: 2,
    maxRounds: 4,
    prompts: { Ash: 'a flying cat' },
    drawings: {},
    guesses: {},
    createdAt: 1,
  },
}

describe('DrawPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLocation.mockReturnValue({
      state: { roomCode: 'ABC123', playerName: 'Ash' },
    })
    mockGetRoom.mockResolvedValue(roomFixture)
    mockUsePhaseAdvance.mockReturnValue({ waitingFor: 0, room: roomFixture.room })
    mockGetDrawingImage.mockReturnValue('data:image/png;base64,fake')
    mockRecorderStop.mockResolvedValue(null)
    mockSubmitDrawing.mockResolvedValue({ success: true, room: { phase: 'draw' } })
  })

  test('redirects to the home page when roomCode is missing', () => {
    mockUseLocation.mockReturnValue({ state: { playerName: 'Ash' } })

    render(<DrawPage />)

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  test('redirects to the home page when playerName is missing', () => {
    mockUseLocation.mockReturnValue({ state: { roomCode: 'ABC123' } })

    render(<DrawPage />)

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  test('fetches the room and displays the round and prompt', async () => {
    render(<DrawPage />)

    await waitFor(() => {
      expect(screen.getByText('Round 2 of 4')).toBeInTheDocument()
    })
    expect(screen.getByText('a flying cat')).toBeInTheDocument()
  })

  test('starts the recorder once the round is known', async () => {
    render(<DrawPage />)

    await waitFor(() => {
      expect(screen.getByText('Round 2 of 4')).toBeInTheDocument()
    })

    // Recorder start is scheduled with a short delay; advance real timers
    // via waitFor rather than fake timers here, since the effect chain
    // depends on the resolved getRoom promise too.
    await waitFor(
      () => {
        expect(mockRecorderStart).toHaveBeenCalledTimes(1)
      },
      { timeout: 1000 },
    )
  })

  test('shows an error instead of submitting when the drawing image is not ready', async () => {
    mockGetDrawingImage.mockReturnValue(null)

    render(<DrawPage />)
    await waitFor(() => screen.getByText('Round 2 of 4'))

    fireEvent.click(screen.getByText('Submit Drawing'))

    await waitFor(() => {
      expect(screen.getByText('Canvas is not ready yet.')).toBeInTheDocument()
    })
    expect(mockSubmitDrawing).not.toHaveBeenCalled()
  })

  test('submits the drawing and stops the recorder together', async () => {
    render(<DrawPage />)
    await waitFor(() => screen.getByText('Round 2 of 4'))

    fireEvent.click(screen.getByText('Submit Drawing'))

    await waitFor(() => {
      expect(mockSubmitDrawing).toHaveBeenCalledWith(
        'ABC123',
        'Ash',
        'data:image/png;base64,fake',
      )
    })
    expect(mockRecorderStop).toHaveBeenCalledTimes(1)
  })

  test('saves the recording when the recorder returns a blob URL', async () => {
    mockRecorderStop.mockResolvedValue('blob:fake-url')

    render(<DrawPage />)
    await waitFor(() => screen.getByText('Round 2 of 4'))

    fireEvent.click(screen.getByText('Submit Drawing'))

    await waitFor(() => {
      expect(mockSaveRecording).toHaveBeenCalledWith(
        expect.objectContaining({
          round: 2,
          blobUrl: 'blob:fake-url',
          prompt: 'a flying cat',
        }),
      )
    })
  })

  test('navigates to the guess page when the submission moves the room into the guess phase', async () => {
    mockSubmitDrawing.mockResolvedValue({
      success: true,
      room: { phase: 'guess' },
    })

    render(<DrawPage />)
    await waitFor(() => screen.getByText('Round 2 of 4'))

    fireEvent.click(screen.getByText('Submit Drawing'))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/guess', {
        state: { roomCode: 'ABC123', playerName: 'Ash' },
      })
    })
  })

  test('shows the submission error and re-enables submission when submitDrawing fails', async () => {
    mockSubmitDrawing.mockResolvedValue({
      success: false,
      message: 'Room is full.',
    })

    render(<DrawPage />)
    await waitFor(() => screen.getByText('Round 2 of 4'))

    fireEvent.click(screen.getByText('Submit Drawing'))

    await waitFor(() => {
      expect(screen.getByText('Room is full.')).toBeInTheDocument()
    })
    expect(screen.getByText('Submit Drawing')).not.toBeDisabled()
  })

  test('shows a waiting message with the correct pluralisation after submitting', async () => {
    mockUsePhaseAdvance.mockReturnValue({ waitingFor: 2, room: roomFixture.room })

    render(<DrawPage />)
    await waitFor(() => screen.getByText('Round 2 of 4'))

    fireEvent.click(screen.getByText('Submit Drawing'))

    await waitFor(() => {
      expect(screen.getByText('Waiting for 2 other players...')).toBeInTheDocument()
    })
  })

  test('shows the starting message once nobody else is waited on', async () => {
    mockUsePhaseAdvance.mockReturnValue({ waitingFor: 0, room: roomFixture.room })

    render(<DrawPage />)
    await waitFor(() => screen.getByText('Round 2 of 4'))

    fireEvent.click(screen.getByText('Submit Drawing'))

    await waitFor(() => {
      expect(screen.getByText('Starting guessing phase...')).toBeInTheDocument()
    })
  })

  test('the timer expiring auto-submits the drawing if not already submitted', async () => {
    render(<DrawPage />)
    await waitFor(() => screen.getByText('Round 2 of 4'))

    fireEvent.click(screen.getByTestId('expire-timer'))

    await waitFor(() => {
      expect(mockSubmitDrawing).toHaveBeenCalledTimes(1)
    })
  })

  test('the timer expiring after submission does not submit again', async () => {
    render(<DrawPage />)
    await waitFor(() => screen.getByText('Round 2 of 4'))

    fireEvent.click(screen.getByText('Submit Drawing'))
    await waitFor(() => expect(mockSubmitDrawing).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByTestId('expire-timer'))

    // Still only the one call from the manual submit above.
    expect(mockSubmitDrawing).toHaveBeenCalledTimes(1)
  })
})