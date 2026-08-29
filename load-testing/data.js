/*
 * The backend runs on port 3000 inside the Docker container.
 *
 * BASE_URL can be overridden with an environment variable so that
 * the exact same tests can run locally and in GitHub Actions.
 *
 * Local:
 *     BASE_URL=http://localhost:3000 k6 run ...
 *
 * GitHub Actions can provide the same variable through the workflow.
 */
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

/*
 * Number of players used in our normal gameplay scenario.
 *
 * Player 1 is the host. The remaining players join the room.
 */
export const PLAYERS_PER_ROOM = 5;

/*
 * Maximum amount of time a player should wait for the room
 * to enter the expected phase.
 */
export const PHASE_TIMEOUT_SECONDS = 30;

/*
 * The real drawing canvas can produce PNG data URLs that are
 * hundreds of KB in size.
 *
 * k6 is not running a browser, so we cannot generate an actual
 * canvas drawing. Instead, we create a synthetic payload of
 * approximately the same size.
 *
 * The server only requires the value to begin with "data:image/",
 * so this accurately exercises the HTTP payload and server-side
 * room-state handling without requiring a browser.
 */
const DRAWING_SIZE_BYTES = 200 * 1024;

export const TEST_DRAWING =
    'data:image/png;base64,' + 'A'.repeat(DRAWING_SIZE_BYTES);