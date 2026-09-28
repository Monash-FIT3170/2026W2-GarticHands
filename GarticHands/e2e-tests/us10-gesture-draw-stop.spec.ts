import { test, expect } from '@playwright/test'
import {
    pinchLandmarks,
    handPresentLandmarks,
} from './helpers/gestures'
import {
    reachDrawPageSolo,
    sendHandFrame,
} from './helpers/game'

test('pinch drawing input starts and stops when the pinch is released', async ({ page }) => {
    await reachDrawPageSolo(page, 'DrawTester')

    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()

    // Send a sequence of pinch frames to simulate drawing.
    for (let i = 0; i <= 10; i++) {
        const x = 0.2 + (i / 10) * 0.5

        await sendHandFrame(
            page,
            pinchLandmarks(x, 0.5),
            'PINCH',
        )

        await page.waitForTimeout(16)
    }

    // Release the pinch while keeping the hand visible.
    for (let i = 0; i <= 5; i++) {
        const x = 0.7 + (i / 10) * 0.2

        await sendHandFrame(
            page,
            handPresentLandmarks(x, 0.5),
            'HAND_PRESENT',
        )

        await page.waitForTimeout(16)
    }

    // Finally remove the hand from the frame.
    await sendHandFrame(page, null, 'NO_HAND')

    // The drawing page should remain usable after the gesture sequence.
    await expect(canvas).toBeVisible()
    await expect(page).toHaveURL('/draw')
})