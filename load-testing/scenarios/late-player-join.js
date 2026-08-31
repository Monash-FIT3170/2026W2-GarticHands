import { check } from 'k6';
import {
    createRoom,
    joinRoom,
    setReady,
    waitForPlayers,
    waitForGameStart,
    waitForPhase,
    startGame,
    playRound,
} from '../helpers/game.js';
import { post } from '../helpers/api.js';

/*
 * Tests that players can join a game after it has started.
 *
 * Three players start the game, while two additional players join
 * late. The test expects the late joins to be accepted, the late
 * joiners to be flagged as mid-round joiners, and the original three
 * players to finish the round without waiting on the late joiners.
 */

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

    // Players 4 and 5 wait until the game has started, then join late.
    if (__VU === 4 || __VU === 5) {
        waitForGameStart(roomCode);

        const response = post(
            '/rooms/join',
            {
                roomCode,
                playerName,
            },
            { name: 'late_join' },
        );

        console.log(`${playerName} late join status: ${response.status}`);

        // Late joins are accepted, and the late joiner is marked as a
        // mid-round joiner so the current round doesn't wait on them.
        check(response, {
            [`Late join ${playerName}: accepted`]: (r) =>
                r.status >= 200 && r.status < 300,
            [`Late join ${playerName}: room already started`]: (r) =>
                r.json().room.status === 'started',
            [`Late join ${playerName}: flagged as mid-round joiner`]: (r) => {
                const me = r.json().room.players.find(
                    (p) => p.name === playerName,
                );

                return me !== undefined && me.joinedMidRound === true;
            },
        });

        // The round must still complete even though the late joiners
        // never submit anything for it.
        waitForPhase(roomCode, 'reveal');
    }

    // Players 1-3 complete the game normally.
    if (__VU <= INITIAL_PLAYERS) {
        playRound(roomCode, playerName);
    }
}
