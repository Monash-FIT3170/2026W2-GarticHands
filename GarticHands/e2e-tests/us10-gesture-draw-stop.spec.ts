import { test, expect, type Locator } from '@playwright/test'
import { pinchLandmarks, handPresentLandmarks } from './helpers/gestures'
import { reachDrawPageSolo, sendHandFrame } from './helpers/game'

/**
 * User Story 10: As a player, I want to use a gesture to start and stop
 * drawing so that I have control over my strokes.
 *
 * Uses the test-only hand-frame injection seam. Sending PINCH frames should
 * paint pixels onto the drawing canvas; switching to HAND_PRESENT or NO_HAND
 * should stop extending the stroke even as more frames are sent.
 */
async function countPaintedPixels(canvas: Locator): Promise<number> {
    return canvas.evaluate((el: HTMLCanvasElement) => {
        const ctx = el.getContext('2d')!
        const { data } = ctx.getImageData(0, 0, el.width, el.height)
        let count = 0
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) count++ // alpha channel — anything painted is non-transparent
        }
        return count
    })
}

test('pinch draws a stroke; releasing the pinch stops extending it', async ({ page }) => {
    await reachDrawPageSolo(page, 'DrawTester')

    // Default draw mode is 'split': [camera-overlay canvas, primary draw canvas, cursor canvas].
    const canvas = page.locator('canvas').nth(1)
    await expect(canvas).toBeVisible()

    expect(await countPaintedPixels(canvas)).toBe(0)

    // Pinch and drag across the canvas — should paint a visible stroke.
    for (let i = 0; i <= 10; i++) {
        const x = 0.2 + (i / 10) * 0.5
        await sendHandFrame(page, pinchLandmarks(x, 0.5), 'PINCH')
    }

    const paintedAfterPinch = await countPaintedPixels(canvas)
    expect(paintedAfterPinch).toBeGreaterThan(0)

    // Release the pinch (hand still visible, but not pinching) — no more ink.
    for (let i = 0; i <= 5; i++) {
        const x = 0.7 + (i / 10) * 0.2
        await sendHandFrame(page, handPresentLandmarks(x, 0.5), 'HAND_PRESENT')
    }
    expect(await countPaintedPixels(canvas)).toBe(paintedAfterPinch)

    // Hand leaves the frame entirely — still no more ink.
    await sendHandFrame(page, null, 'NO_HAND')
    expect(await countPaintedPixels(canvas)).toBe(paintedAfterPinch)
})
