import type { Room } from '../types/room';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface RoomResponse {
  success: boolean;
  message?: string;
  room?: Room;
  roomCode?: string;
  /**
   * `Date.now()` on the server when the response was built (only on
   * `GET /rooms/:code`). Subtract it from `room.phaseEndsAt` to get a countdown
   * that is immune to browser clock skew.
   */
  serverTime?: number;
}

/**
 * HTTP 409 from a submit endpoint means the room already left that phase —
 * normally because its deadline passed and the server force-advanced. Callers
 * treat it as "too late, follow the room" rather than as a failure.
 */
export const PhaseConflictStatus = 409;

interface SubmitResponse extends RoomResponse {
  /** HTTP status, so callers can tell a phase-deadline 409 from a real error. */
  status: number;
}

/** Parsed body plus the HTTP status, so callers can tell a 409 from a real error. */
async function withStatus(res: Response): Promise<SubmitResponse> {
  return { ...((await res.json()) as RoomResponse), status: res.status };
}

export async function createRoom(hostName: string) {
  const res = await fetch(`${API_URL}/rooms/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostName }),
  });

  return (await res.json()) as RoomResponse;
}

export async function joinRoom(roomCode: string, playerName: string) {
  const res = await fetch(`${API_URL}/rooms/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode, playerName }),
  });

  return (await res.json()) as RoomResponse;
}

export async function getRoom(roomCode: string) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}`);
  return (await res.json()) as RoomResponse;
}

export async function updateReady(roomCode: string, playerName: string, ready: boolean) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}/ready`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, ready }),
  });

  return (await res.json()) as RoomResponse;
}

export async function startRoom(roomCode: string) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}/start`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });

  return (await res.json()) as RoomResponse;
}

export async function submitPrompt(roomCode: string, playerName: string, prompt: string) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}/prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, prompt }),
  });
  return withStatus(res);
}

export async function submitDrawing(roomCode: string, playerName: string, dataUrl: string) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}/drawings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, dataUrl }),
  });
  return withStatus(res);
}

export async function submitGuess(roomCode: string, playerName: string, guess: string) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}/guesses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, guess }),
  });
  return withStatus(res);
}

export async function restartRoom(roomCode: string) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}/restart`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
  return (await res.json()) as RoomResponse;
}

export async function endRoom(roomCode: string) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}/end`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
  return (await res.json()) as RoomResponse;
}
