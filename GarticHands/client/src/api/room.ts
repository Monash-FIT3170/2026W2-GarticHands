import type { Room } from "../types/room"

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

interface RoomResponse {
  success: boolean
  message?: string
  room?: Room
  roomCode?: string
}

export async function createRoom(hostName: string) {
  const res = await fetch(`${API_URL}/rooms/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hostName }),
  })

  return (await res.json()) as RoomResponse
}

export async function joinRoom(roomCode: string, playerName: string) {
  const res = await fetch(`${API_URL}/rooms/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode, playerName }),
  })

  return (await res.json()) as RoomResponse
}

export async function getRoom(roomCode: string) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}`)
  return (await res.json()) as RoomResponse
}

export async function updateReady(roomCode: string, playerName: string, ready: boolean) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}/ready`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerName, ready }),
  });

  return (await res.json()) as RoomResponse
}

export async function startRoom(roomCode: string) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}/start`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  })

  return (await res.json()) as RoomResponse
}

export async function submitPrompt(
  roomCode: string,
  playerName: string,
  prompt: string,
) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}/prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, prompt }),
  })
  return (await res.json()) as RoomResponse
}

export async function submitDrawing(
  roomCode: string,
  playerName: string,
  dataUrl: string,
) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}/drawings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, dataUrl }),
  })
  return (await res.json()) as RoomResponse
}

export async function submitGuess(
  roomCode: string,
  playerName: string,
  guess: string,
) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}/guesses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, guess }),
  })
  return (await res.json()) as RoomResponse
}

export async function restartRoom(roomCode: string) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}/restart`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  })
  return (await res.json()) as RoomResponse
}

export async function endRoom(roomCode: string) {
  const res = await fetch(`${API_URL}/rooms/${roomCode}/end`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  })
  return (await res.json()) as RoomResponse
}