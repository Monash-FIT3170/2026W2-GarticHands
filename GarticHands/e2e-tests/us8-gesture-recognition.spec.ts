import { test, expect } from '@playwright/test'
import { detectGesture } from '../client/src/drawing/gestures/GestureRecogniser'
import { GestureType } from '../client/src/drawing/gestures/GestureTypes'
import type { HandLandmark } from '../client/src/drawing/Models/HandLandmark'
import { PinchStabilizer } from '../client/src/drawing/gestures/detectors/detectPinch'
import {
    pinchLandmarks,
    handPresentLandmarks,
    openPalmLandmarks,
} from './helpers/gestures'

/**
 * User Story 8: As a player, I want to be able to have my hand gestures be
 * recognised with minimal errors to avoid frustration.
 *
 * Runs `detectGesture()` against a labelled fixture set — no hand, hand
 * present, pinch, open palm, and noisy boundary samples — and asserts overall
 * accuracy. This exercises the real detector pipeline (unlike the existing
 * Vitest unit test, which mocks each detector).
 */
interface Sample {
    label: string
    landmarks: HandLandmark[] | undefined
    expected: GestureType
}

function noisy(base: HandLandmark[], jitter: number): HandLandmark[] {
    return base.map((p) => ({
        x: p.x + (Math.random() - 0.5) * jitter,
        y: p.y + (Math.random() - 0.5) * jitter,
        z: p.z,
    }))
}

test('detectGesture recognises hand gestures with minimal errors across labelled fixtures', () => {
    const samples: Sample[] = [
        {
            label: 'no hand (undefined)',
            landmarks: undefined,
            expected: GestureType.NO_HAND,
        },
        {
            label: 'no hand (empty array)',
            landmarks: [],
            expected: GestureType.NO_HAND,
        },
        {
            label: 'pinch, centered',
            landmarks: pinchLandmarks(0.5, 0.5),
            expected: GestureType.PINCH,
        },
        {
            label: 'pinch, near edge',
            landmarks: pinchLandmarks(0.1, 0.9),
            expected: GestureType.PINCH,
        },
        {
            label: 'open palm, centered',
            landmarks: openPalmLandmarks(0.5, 0.5),
            expected: GestureType.OPEN_PALM,
        },
        {
            label: 'open palm, near edge',
            landmarks: openPalmLandmarks(0.9, 0.1),
            expected: GestureType.OPEN_PALM,
        },
        {
            label: 'hand present, centered',
            landmarks: handPresentLandmarks(0.5, 0.5),
            expected: GestureType.HAND_PRESENT,
        },
        {
            label: 'hand present, near edge',
            landmarks: handPresentLandmarks(0.2, 0.2),
            expected: GestureType.HAND_PRESENT,
        },
        {
            label: 'pinch with small jitter',
            landmarks: noisy(pinchLandmarks(0.5, 0.5), 0.01),
            expected: GestureType.PINCH,
        },
        {
            label: 'open palm with small jitter',
            landmarks: noisy(openPalmLandmarks(0.5, 0.5), 0.01),
            expected: GestureType.OPEN_PALM,
        },
        {
            label: 'hand present with small jitter',
            landmarks: noisy(handPresentLandmarks(0.5, 0.5), 0.01),
            expected: GestureType.HAND_PRESENT,
        },
    ]

    const results = samples.map((sample) => {
        // Each fixture gets a fresh stabilizer so state from one sample
        // cannot affect the result of another sample.
        const pinchStabilizer = new PinchStabilizer()

        return {
            ...sample,
            actual: detectGesture(sample.landmarks, pinchStabilizer),
        }
    })

    const failures = results.filter((result) => result.actual !== result.expected)
    const accuracy = (results.length - failures.length) / results.length

    if (failures.length > 0) {
        console.log(
            'Gesture recognition failures:',
            failures.map(
                (failure) =>
                    `${failure.label}: expected ${failure.expected}, got ${failure.actual}`,
            ),
        )
    }

    // Require near-perfect accuracy — any miss on these fixtures is a regression.
    expect(accuracy).toBeGreaterThanOrEqual(0.9)
    expect(failures).toHaveLength(0)
})