import { check } from 'k6';
import {
    createRoom,
    joinRoom,
    setReady,
    waitForPlayers,
    startGame,
    playRound,
} from '../helpers/game.js';

const PLAYERS_PER_GAME = 3;
const TOTAL_PLAYERS = 6;

export const options = {
    vus: TOTAL_PLAYERS,
    iterations: TOTAL_PLAYERS,

    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<500'],
        checks: ['rate>0.99'],
    },
};

/*
 * Create two separate rooms.
 *
 * Game 1:
 *   LoadTestPlayer1
 *   LoadTestPlayer2
 *   LoadTestPlayer3
 *
 * Game 2:
 *   LoadTestPlayer4
 *   LoadTestPlayer5
 *   LoadTestPlayer6
 *
 * Each room is independent but both games will run
 * concurrently during the test.
 */
export function setup() {
    const room1 = createRoom('LoadTestPlayer1');
    const room2 = createRoom('LoadTestPlayer4');

    check(room1, {
        'Setup: first room created': (code) => typeof code === 'string',
    });

    check(room2, {
        'Setup: second room created': (code) => typeof code === 'string',
    });

    return {
        room1,
        room2,
    };
}

export default function (data) {
    const playerNumber = __VU;
    const playerName = `LoadTestPlayer${playerNumber}`;

    /*
     * Players 1-3 belong to Game 1.
     * Players 4-6 belong to Game 2.
     */
    const isFirstGame = playerNumber <= 3;
    const roomCode = isFirstGame ? data.room1 : data.room2;

    /*
     * The first player in each game is the host.
     * The remaining players join normally.
     */
    const isHost = playerNumber === 1 || playerNumber === 4;

    if (!isHost) {
        joinRoom(roomCode, playerName);
        setReady(roomCode, playerName);
    }

    /*
     * Each host waits for their own three players
     * before starting their game.
     */
    if (isHost) {
        waitForPlayers(roomCode, PLAYERS_PER_GAME);
        startGame(roomCode);
    }

    /*
     * All players independently play their respective game.
     */
    playRound(roomCode, playerName);
}