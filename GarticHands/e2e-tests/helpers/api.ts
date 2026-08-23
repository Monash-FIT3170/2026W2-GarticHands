import type { APIRequestContext } from '@playwright/test'

export const API_URL = 'http://localhost:3000'

export interface RoomPlayer {
    name: string
    status: 'host' | 'waiting' | 'ready'
    isHost: boolean
    ready: boolean
    joinedAt: number
}

export interface Room {
    code: string
    players: RoomPlayer[]
    status: 'waiting' | 'started'
    phase: 'lobby' | 'prompt' | 'draw' | 'guess' | 'reveal'
    round: number
    maxRounds: number
    prompts: Record<string, string>
    drawings: Record<string, string>
    guesses: Record<string, string>
    createdAt: number
}

/** Thin wrapper around the Gartic Hands REST API for seeding/inspecting rooms in tests. */
export class RoomApi {
    constructor(private readonly request: APIRequestContext) { }

    async createRoom(hostName: string) {
        const res = await this.request.post(`${API_URL}/rooms/create`, { data: { hostName } })
        return res.json() as Promise<{ success: boolean; roomCode: string; room: Room }>
    }

    async joinRoom(roomCode: string, playerName: string) {
        const res = await this.request.post(`${API_URL}/rooms/join`, { data: { roomCode, playerName } })
        return res.json() as Promise<{ success: boolean; room: Room; message?: string }>
    }

    async getRoom(roomCode: string) {
        const res = await this.request.get(`${API_URL}/rooms/${roomCode}`)
        return res.json() as Promise<{ success: boolean; room: Room }>
    }

    async setReady(roomCode: string, playerName: string, ready: boolean) {
        const res = await this.request.patch(`${API_URL}/rooms/${roomCode}/ready`, {
            data: { playerName, ready },
        })
        return res.json() as Promise<{ success: boolean; room: Room }>
    }

    async start(roomCode: string) {
        const res = await this.request.patch(`${API_URL}/rooms/${roomCode}/start`)
        return { status: res.status(), body: await res.json() as { success: boolean; room?: Room; message?: string } }
    }

    async submitPrompt(roomCode: string, playerName: string, prompt: string) {
        const res = await this.request.post(`${API_URL}/rooms/${roomCode}/prompts`, {
            data: { playerName, prompt },
        })
        return res.json() as Promise<{ success: boolean; room: Room }>
    }

    async submitDrawing(roomCode: string, playerName: string, dataUrl: string) {
        const res = await this.request.post(`${API_URL}/rooms/${roomCode}/drawings`, {
            data: { playerName, dataUrl },
        })
        return res.json() as Promise<{ success: boolean; room: Room }>
    }

    async submitGuess(roomCode: string, playerName: string, guess: string) {
        const res = await this.request.post(`${API_URL}/rooms/${roomCode}/guesses`, {
            data: { playerName, guess },
        })
        return res.json() as Promise<{ success: boolean; room: Room }>
    }
}

/** 1x1 red PNG — small, valid `data:image/...` fixture for drawing/guess submissions. */
export const FIXTURE_DRAWING_DATA_URL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
