/**
 * usePhaseAdvance.test.tsx
 *
 * Tests for the usePhaseAdvance hook (client/src/hooks/usePhaseAdvance).
 *
 * usePhaseAdvance polls a room's state (via getRoom) and is responsible for:
 * - Fetching/polling room data for a given roomCode.
 * - Tracking how many other players are still waiting to submit something
 *   for the current phase.
 * - Navigating when the room's phase matches whenPhase.
 *
 * The hook is rendered via renderHook inside a MemoryRouter wrapper.
 * getRoom is mocked so tests do not call a real server.
 */

import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { usePhaseAdvance } from '../client/src/hooks/usePhaseAdvance';
import { getRoom } from '../client/src/api/room';

// Replace the real API call with a mock so tests can control its response.
vi.mock('../client/src/api/room', () => ({
  getRoom: vi.fn(),
}));

const mockedGetRoom = vi.mocked(getRoom);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('usePhaseAdvance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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
            lastSeen: 1,
          },
        ],
        status: 'started',
        mode: 'classic',
        phase: 'draw',
        phaseEndsAt: null,
        round: 1,
        maxRounds: 4,
        prompts: {},
        drawings: {},
        guesses: {},
        ratings: {},
        scores: {},
        createdAt: 1,
      },
    });

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
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedGetRoom).toHaveBeenCalledWith('ABC123', 'Ash');
  });

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
            lastSeen: 1,
          },
          {
            name: 'Sam',
            status: 'ready',
            isHost: false,
            ready: true,
            joinedAt: 2,
            lastSeen: 2,
          },
          {
            name: 'Alex',
            status: 'ready',
            isHost: false,
            ready: true,
            joinedAt: 3,
            lastSeen: 3,
          },
        ],
        status: 'started',
        mode: 'classic',
        phase: 'draw',
        phaseEndsAt: null,
        round: 1,
        maxRounds: 4,
        prompts: {},
        drawings: {
          Ash: 'drawing-data',
        },
        guesses: {},
        ratings: {},
        scores: {},
        createdAt: 1,
      },
    });

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
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.waitingFor).toBe(2);
  });

  test('excludes mid-round joiners from the waiting count', async () => {
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
            lastSeen: 1,
          },
          {
            name: 'Sam',
            status: 'ready',
            isHost: false,
            ready: true,
            joinedAt: 2,
            lastSeen: 2,
          },
          {
            name: 'Riley',
            status: 'waiting',
            isHost: false,
            ready: false,
            joinedMidRound: true,
            joinedAt: 3,
            lastSeen: 3,
          },
        ],
        status: 'started',
        mode: 'classic',
        phase: 'draw',
        phaseEndsAt: null,
        round: 1,
        maxRounds: 4,
        prompts: {},
        drawings: {
          Ash: 'drawing-data',
        },
        guesses: {},
        ratings: {},
        scores: {},
        createdAt: 1,
      },
    });

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
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.waitingFor).toBe(1);
  });
});
