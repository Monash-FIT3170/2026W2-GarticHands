import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { usePhaseAdvance } from '../src/hooks/usePhaseAdvance'
import { getRoom } from '../src/api/room'

vi.mock('../src/api/room', () => ({
  getRoom: vi.fn(),
}))

const mockedGetRoom = vi.mocked(getRoom)

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
)

describe('usePhaseAdvance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('polls the room for updates', async () => {
    mockedGetRoom.mockResolvedValue({
      success: true,
      room: {
        code: 'ABC123',
        players: [
          {
            name: 'Ash',
            status: 'host',
            isHost: true,
            ready: true,
            joinedAt: 1,
          },
        ],
        status: 'started',
        phase: 'draw',
        round: 1,
        maxRounds: 4,
        prompts: {},
        drawings: {},
        guesses: {},
        createdAt: 1,
      },
    })

    renderHook(
      () =>
        usePhaseAdvance({
          roomCode: 'ABC123',
          playerName: 'Ash',
          enabled: true,
          whenPhase: 'guess',
          to: '/guess',
          countBucket: 'drawings',
        }),
      { wrapper },
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(mockedGetRoom).toHaveBeenCalledWith('ABC123')
  })

  test('updates waiting count based on submitted players', async () => {
    mockedGetRoom.mockResolvedValue({
      success: true,
      room: {
        code: 'ABC123',
        players: [
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
            status: 'ready',
            isHost: false,
            ready: true,
            joinedAt: 3,
          },
        ],
        status: 'started',
        phase: 'draw',
        round: 1,
        maxRounds: 4,
        prompts: {},
        drawings: {
          Ash: 'drawing-data',
        },
        guesses: {},
        createdAt: 1,
      },
    })

    const { result } = renderHook(
      () =>
        usePhaseAdvance({
          roomCode: 'ABC123',
          playerName: 'Ash',
          enabled: true,
          whenPhase: 'guess',
          to: '/guess',
          countBucket: 'drawings',
        }),
      { wrapper },
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.waitingFor).toBe(2)
  })
})