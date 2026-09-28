import { test, expect } from '@playwright/test'
import { pinchLandmarks } from './helpers/gestures'
import { reachDrawPageSolo, sendHandFrame } from './helpers/game'

test('a live drawing session remains functional and can be submitted', async ({ page }) => {
    await reachDrawPageSolo(page, 'LiveDrawer')

    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()

    // Simulate a live pinch-drawing sequence.
    for (let i = 0; i <= 10; i++) {
        const x = 0.2 + (i / 10) * 0.5

        await sendHandFrame(
            page,
            pinchLandmarks(x, 0.5),
            'PINCH',
        )

        await page.waitForTimeout(16)
    }

    // The drawing should be submittable after the live drawing gesture.
    await expect(
        page.getByRole('button', { name: 'Submit Drawing' }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Submit Drawing' }).click()

    // Submission should leave the drawing page successfully.
    await expect(page).not.toHaveURL('/draw')
})