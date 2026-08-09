import { check } from 'k6';
import { sleep } from 'k6';
import {
    createRoom,
    joinRoom,
    setReady,
    waitForPlayers,
    startGame,
    playRound,
} from '../helpers/game.js';
import { post } from '../helpers/api.js';

const INITIAL_PLAYERS = 3;
const TOTAL_PLAYERS = 5;

export const options = {
    vus: TOTAL_PLAYERS,
    iterations: TOTAL_PLAYERS,

    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<500'],
        checks: ['rate>0.99'],
    },
};

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

    // Players 2 and 3 join before the game starts.
    if (__VU === 2 || __VU === 3) {
        joinRoom(roomCode, playerName);
        setReady(roomCode, playerName);
    }

    // Host waits for the initial 3 players, then starts the game.
    if (__VU === 1) {
        waitForPlayers(roomCode, INITIAL_PLAYERS);
        startGame(roomCode);
    }

    // Players 4 and 5 wait until the game has started,
    // then attempt to join the room.
    if (__VU === 4 || __VU === 5) {
        sleep(2);

        const response = post(
            '/rooms/join',
            {
                roomCode,
                playerName,
            },
            { name: 'late_join' },
        );

        console.log(`${playerName} late join status: ${response.status}`);

        // Late joins should be rejected with a 4xx response.
        check(response, {
            [`Late join ${playerName}: rejected`]: (r) =>
                r.status >= 400 && r.status < 500,
        });
    }

    // Players 1-3 complete the game normally.
    if (__VU <= INITIAL_PLAYERS) {
        playRound(roomCode, playerName);
    }
}