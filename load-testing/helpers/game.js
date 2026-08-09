import { sleep } from 'k6';
import { checkSuccess, get, patch, post } from './api.js';
import {
    PHASE_TIMEOUT_SECONDS,
    PLAYERS_PER_ROOM,
    TEST_DRAWING,
} from '../data.js';

/*
 * Create a new Gartic Hands room.
 *
 * The returned room code is then shared between the virtual users
 * participating in the scenario.
 */
export function createRoom(hostName) {
    const response = post(
        '/rooms/create',
        { hostName },
        { name: 'create_room' },
    );

    if (!checkSuccess(response, 'Create room')) {
        return null;
    }

    const body = response.json();

    check(body, {
        'Create room: room code returned': (data) =>
            typeof data.roomCode === 'string',
    });

    return body.roomCode;
}

/*
 * Join an existing room as a player.
 */
export function joinRoom(roomCode, playerName) {
    const response = post(
        '/rooms/join',
        {
            roomCode,
            playerName,
        },
        { name: 'join_room' },
    );

    return checkSuccess(response, `Join room as ${playerName}`);
}

/*
 * Mark a non-host player as ready.
 */
export function setReady(roomCode, playerName) {
    const response = patch(
        `/rooms/${roomCode}/ready`,
        {
            playerName,
            ready: true,
        },
        { name: 'player_ready' },
    );

    return checkSuccess(response, `Ready ${playerName}`);
}

/*
 * Retrieve the current room state.
 *
 * This intentionally represents the polling performed by the real
 * frontend. usePhaseAdvance() calls getRoom() every second, so our
 * load test also performs repeated room-state requests.
 */
export function getRoom(roomCode) {
    const response = get(
        `/rooms/${roomCode}`,
        { name: 'room_poll' },
    );

    if (!checkSuccess(response, 'Get room')) {
        return null;
    }

    return response.json().room;
}

/*
 * Wait until the room reaches a particular phase.
 *
 * The real frontend polls once per second, so the load test uses
 * the same one-second interval rather than continuously hammering
 * the endpoint.
 */
export function waitForPhase(roomCode, expectedPhase) {
    const maxAttempts = PHASE_TIMEOUT_SECONDS;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const room = getRoom(roomCode);

        if (room && room.phase === expectedPhase) {
            return room;
        }

        sleep(1);
    }

    check(false, {
        [`Room reached ${expectedPhase} phase`]: () => false,
    });

    return null;
}

/*
 * Wait until the expected number of players are present.
 */
export function waitForPlayers(roomCode, expectedPlayers) {
    for (let attempt = 0; attempt < PHASE_TIMEOUT_SECONDS; attempt += 1) {
        const room = getRoom(roomCode);

        if (room && room.players.length >= expectedPlayers) {
            return room;
        }

        sleep(1);
    }

    check(false, {
        [`Room reached ${expectedPlayers} players`]: () => false,
    });

    return null;
}

/*
 * Start the game as the host.
 */
export function startGame(roomCode) {
    const response = patch(
        `/rooms/${roomCode}/start`,
        {},
        { name: 'start_game' },
    );

    return checkSuccess(response, 'Start game');
}

/*
 * Submit a prompt for the current round.
 */
export function submitPrompt(roomCode, playerName, prompt) {
    const response = post(
        `/rooms/${roomCode}/prompts`,
        {
            playerName,
            prompt,
        },
        { name: 'submit_prompt' },
    );

    return checkSuccess(response, `Submit prompt: ${playerName}`);
}

/*
 * Submit a drawing for the current round.
 *
 * The payload is intentionally representative of the relatively
 * large PNG data URLs produced by the real drawing canvas.
 */
export function submitDrawing(roomCode, playerName) {
    const response = post(
        `/rooms/${roomCode}/drawings`,
        {
            playerName,
            dataUrl: TEST_DRAWING,
        },
        { name: 'submit_drawing' },
    );

    return checkSuccess(response, `Submit drawing: ${playerName}`);
}

/*
 * Submit a guess for the current round.
 */
export function submitGuess(roomCode, playerName) {
    const response = post(
        `/rooms/${roomCode}/guesses`,
        {
            playerName,
            guess: `Load test guess from ${playerName}`,
        },
        { name: 'submit_guess' },
    );

    return checkSuccess(response, `Submit guess: ${playerName}`);
}

/*
 * Run one complete gameplay round.
 *
 * All virtual users call this function. The server moves to the
 * next phase once every player has submitted their current item.
 */
export function playRound(roomCode, playerName) {
    waitForPhase(roomCode, 'prompt');

    submitPrompt(
        roomCode,
        playerName,
        `Load test prompt from ${playerName}`,
    );

    waitForPhase(roomCode, 'draw');

    submitDrawing(roomCode, playerName);

    waitForPhase(roomCode, 'guess');

    submitGuess(roomCode, playerName);

    waitForPhase(roomCode, 'reveal');
}