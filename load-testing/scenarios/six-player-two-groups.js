import { check } from 'k6';
import {
    createRoom,
    joinRoom,
    setReady,
    waitForPlayers,
    startGame,
    playRound,
} from '../helpers/game.js';

export const options = {
    vus: 6,
    iterations: 6,

    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<500'],
        checks: ['rate>0.99'],
    },
};

/*
 * Create one room for all six players.
 *
 * We logically divide the players into two groups:
 * Group A: Players 1-3
 * Group B: Players 4-6
 *
 * In a real deployment these groups could represent
 * players connecting from different locations.
 */
export function setup() {
    const roomCode = createRoom('LoadTestPlayer1');

    check(roomCode, {
        'Setup: room created': (code) => typeof code === 'string',
    });

    return { roomCode };
}

export default function (data) {
    const roomCode = data.roomCode;
    const playerName = `LoadTestPlayer${__VU}`;

    /*
     * Players 2-6 join the room.
     *
     * Players 1-3 represent Location A.
     * Players 4-6 represent Location B.
     */
    if (__VU > 1) {
        joinRoom(roomCode, playerName);
        setReady(roomCode, playerName);
    }

    /*
     * The host waits until all six players have joined
     * before starting the game.
     */
    if (__VU === 1) {
        waitForPlayers(roomCode, 6);
        startGame(roomCode);
    }

    /*
     * All six players complete the same gameplay round.
     */
    playRound(roomCode, playerName);
}