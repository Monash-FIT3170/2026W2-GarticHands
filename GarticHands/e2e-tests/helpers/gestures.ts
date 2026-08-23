/**
 * Synthetic 21-point hand-landmark fixtures for the `?e2e=hands` injection
 * seam in `useHandTracking.ts`. Coordinates are normalized [0,1], matching
 * real MediaPipe output — `x` is later mirrored by `landmarkToCanvas`.
 *
 * Only the landmark indices the gesture detectors actually read are set to
 * meaningful values (see `detectPinch.ts` / `detectOpenPalm.ts`); the rest are
 * filled with a neutral base position so the array always has 21 entries
 * (required by `detectHandOnScreen`).
 */
export interface Landmark {
    x: number
    y: number
    z: number
}

export type GestureName = 'NO_HAND' | 'HAND_PRESENT' | 'PINCH' | 'OPEN_PALM'

function base(): Landmark[] {
    return Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
}

/** A pinch at normalized point (x, y) — index fingertip (8) drives the canvas cursor. */
export function pinchLandmarks(x: number, y: number): Landmark[] {
    const lm = base()
    lm[5] = { x: x - 0.05, y, z: 0 } // index base — anchors palm width
    lm[17] = { x: x + 0.05, y, z: 0 } // pinky base — palmWidth = 0.1
    lm[4] = { x, y, z: 0 } // thumb tip
    lm[8] = { x, y, z: 0 } // index tip — same point as thumb tip -> distance 0
    return lm
}

/** A hand on-screen but not pinching or open-palming — cursor preview only. */
export function handPresentLandmarks(x: number, y: number): Landmark[] {
    const lm = base()
    lm[5] = { x: x - 0.05, y, z: 0 }
    lm[17] = { x: x + 0.05, y, z: 0 }
    lm[4] = { x: x - 0.2, y, z: 0 } // thumb far from index -> not a pinch
    lm[8] = { x, y, z: 0 }
    // Fingertips below their bases (larger y) -> not an open palm either.
    lm[12] = { x, y: y + 0.1, z: 0 }
    lm[9] = { x, y, z: 0 }
    lm[16] = { x, y: y + 0.1, z: 0 }
    lm[13] = { x, y, z: 0 }
    lm[20] = { x, y: y + 0.1, z: 0 }
    return lm
}

/** All four fingers extended upward from their bases — the erase gesture. */
export function openPalmLandmarks(x: number, y: number): Landmark[] {
    const lm = base()
    lm[5] = { x: x - 0.05, y, z: 0 }
    lm[17] = { x: x + 0.05, y, z: 0 }
    lm[4] = { x: x - 0.2, y, z: 0 }
    for (const [tip, bottom] of [
        [8, 5],
        [12, 9],
        [16, 13],
        [20, 17],
    ] as const) {
        lm[bottom] = { x, y, z: 0 }
        lm[tip] = { x, y: y - 0.1, z: 0 } // tip above base (smaller y) -> extended
    }
    return lm
}
