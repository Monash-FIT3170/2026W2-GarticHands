/**
 * usePhaseAdvance.test.tsx
 *
 * Tests for the `usePhaseAdvance` hook (client/src/hooks/usePhaseAdvance).
 *
 * `usePhaseAdvance` polls a room's state (via `getRoom`) and is responsible for:
 *  - Fetching/polling room data for a given `roomCode`.
 *  - Tracking how many other players are still "waiting" to submit something
 *    for the current phase (based on `countBucket`, e.g. how many players
 *    have entries in `room.drawings`).
 *  - (Elsewhere, not directly tested here) navigating to a new route once the
 *    room's phase matches `whenPhase`.
 *
 * The hook is rendered via `renderHook` inside a `<MemoryRouter>` wrapper,
 * since it relies on react-router internals (e.g. for navigation) even though
 * these specific tests don't assert on navigation directly.
 *
 * `getRoom` (the underlying API call) is mocked so tests can control exactly
 * what "room state" the hook receives without hitting a real server.
 *
 * Note: this file must be `.tsx` (not `.ts`) because it contains JSX
 * (the `<MemoryRouter>` wrapper below), `.ts` files aren't parsed as JSX.
 */

import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { usePhaseAdvance } from '../client/src/hooks/usePhaseAdvance'
import { getRoom } from '../client/src/api/room'

// Replace the real API call with a mock so we can control its resolved value
// per test instead of making real network requests.
vi.mock('../client/src/api/room', () => ({
  getRoom: vi.fn(),
}))

// Typed handle to the mocked function, so `.mockResolvedValue(...)` etc. are
// properly typed against the real `getRoom` signature.
const mockedGetRoom = vi.mocked(getRoom)

// Wrapper required by `renderHook` since `usePhaseAdvance` depends on
// react-router context. `MemoryRouter` provides that context in tests
// without needing a real browser URL/history.
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
)

describe('usePhaseAdvance', () => {
  beforeEach(() => {
    vi.clearAllMocks()   // reset mock call history between tests
    vi.useFakeTimers()   // hook polls on an interval, use fake timers to control it
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('polls the room for updates', async () => {
    // Mock a "room" API response: a single host player, currently in the
    // draw phase of round 1.
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
          whenPhase: 'guess',   // hook should navigate once phase becomes 'guess'
          to: '/guess',
          countBucket: 'drawings', // count submissions via room.drawings
        }),
      { wrapper },
    )

    // Flush pending microtasks (the mocked getRoom's resolved promise) so any
    // state updates triggered by the initial fetch have settled.
    await act(async () => {
      await Promise.resolve()
    })

    // The hook should have called the API with the room code it was given.
    expect(mockedGetRoom).toHaveBeenCalledWith('ABC123')
  })

  test('updates waiting count based on submitted players', async () => {
    // 3 players total, but only Ash has an entry in `drawings`, so 2 players
    // (Sam and Alex) are still expected to be "waiting".
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
          Ash: 'drawing-data', // only Ash has submitted so far
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

    // 3 players - 1 submitted (Ash) = 2 players still waited on.
    expect(result.current.waitingFor).toBe(2)
  })
})