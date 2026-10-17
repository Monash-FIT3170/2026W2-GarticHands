import type { GameMode, Room } from '../types/room';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

interface RoomResponse {
  success: boolean;
  message?: string;
  room?: Room;
  roomCode?: string;
  serverTime?: number;
}

export const PhaseConflictStatus = 409;

interface SubmitResponse extends RoomResponse {
  status: number;
}

async function withStatus(res: Response): Promise<SubmitResponse> {
  return { ...((await res.json()) as RoomResponse), status: res.status };
}

export async function createRoom(hostName: string, gameMode: GameMode = 'classic', aiMode = false) {
  const res = await fetch(`${API_URL}/rooms/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostName, mode: gameMode, aiMode }),
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

export async function getRoom(roomCode: string, playerName?: string) {
  const query = playerName ? `?playerName=${encodeURIComponent(playerName)}` : '';
  const res = await fetch(`${API_URL}/rooms/${roomCode}${query}`);
  return (await res.json()) as RoomResponse;
}

export async function leaveRoom(roomCode: string, playerName: string, keepalive = false) {
  const res = await fetch(
    `${API_URL}/rooms/${roomCode}/players/${encodeURIComponent(playerName)}`,
    {
      method: 'DELETE',
      keepalive,
    },
  );
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

export async function updateRoomSettings(
  roomCode: string,
  playerName: string,
  settings: { drawTimeSeconds?: number; maxRounds?: number },
) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, ...settings }),
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

export async function submitGuess(
  roomCode: string,
  playerName: string,
  guess: string,
  of?: string,
) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}/guesses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, guess, of }),
  });
  return withStatus(res);
}

/**
 * Move a Leaderboard room from the rating reveal into the leaderboard phase.
 * This is host-paced because the leaderboard phase has no automatic timer.
 */
export async function advanceRatingReveal(roomCode: string) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}/rating-reveal`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });

  return (await res.json()) as RoomResponse;
}

/**
 * Submit a rating for the drawing assigned to this player.
 * The server determines the rating target, so the client cannot rate
 * a different player's drawing.
 */
export async function submitRating(roomCode: string, playerName: string, rating: number) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, rating }),
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

/**
 * Add a bot to the lobby. Host only — the server plays the bot's turns.
 * Remove a bot with `leaveRoom(roomCode, botName)`, like any other player.
 */
export async function addBot(roomCode: string, playerName: string) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}/bots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName }),
  });
  return (await res.json()) as RoomResponse;
}

export interface AiDrawingResponse {
  success: boolean;
  message?: string;
  prompt?: string;
  /** `ai` when the LLM drew it, `template` when the offline fallback did. */
  source?: 'ai' | 'template';
  /** Animated SVG data URL, drawn in the same style as the game canvas. */
  dataUrl?: string;
}

/** Ask the server to draw `prompt` the way a bot would. */
export async function aiDraw(prompt: string) {
  const res = await fetch(`${API_URL}/ai/draw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  return (await res.json()) as AiDrawingResponse;
}
