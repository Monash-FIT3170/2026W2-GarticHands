import { check } from 'k6';
import { createRoom, joinRoom, setReady, waitForPlayers, startGame, playRound } from '../helpers/game.js';
import { PLAYERS_PER_ROOM } from '../data.js';

export const options = {
    vus: PLAYERS_PER_ROOM,
    iterations: PLAYERS_PER_ROOM,

    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<500'],
        checks: ['rate>0.99'],
    },
};

/*
 * setup() runs once before the virtual users begin.
 *
 * We create exactly one room so all five virtual users participate
 * in the same game.
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

    /*
     * __VU identifies the current virtual user.
     *
     * VU 1 represents the host because the room was created with
     * LoadTestPlayer1 already inside it.
     */
    const playerName = `LoadTestPlayer${__VU}`;

    if (__VU > 1) {
        joinRoom(roomCode, playerName);
        setReady(roomCode, playerName);
    }

    /*
     * The host waits for all five players to join before starting.
     *
     * This prevents the test from starting the game while other
     * virtual users are still joining.
     */
    if (__VU === 1) {
        waitForPlayers(roomCode, PLAYERS_PER_ROOM);
        startGame(roomCode);
    }

    /*
     * Every virtual user now follows the same gameplay flow.
     *
     * The backend controls the phase transitions: it only moves
     * from prompt -> draw -> guess -> reveal after every player
     * has submitted their current item.
     */
    playRound(roomCode, playerName);
}