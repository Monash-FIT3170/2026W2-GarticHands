import type { HandLandmark } from './drawing/Models/HandLandmark'
import type { GestureType } from './drawing/gestures/GestureTypes'

/**
 * Test-only seam used by Playwright e2e tests (see `GarticHands/e2e-tests/`).
 * Populated at runtime only when `useHandTracking` mounts in its `?e2e=hands`
 * test mode — never present during normal use.
 */
interface GhTestHooks {
    /** Feeds a synthetic hand-tracking frame straight into the drawing pipeline. */
    injectHandFrame?: (landmarks: HandLandmark[] | null, gesture: GestureType) => void
}

declare global {
    interface Window {
        __ghTestHooks?: GhTestHooks
    }
}

export { }
