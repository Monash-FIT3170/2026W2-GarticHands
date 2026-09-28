import { test, expect, type Locator } from '@playwright/test'
import { pinchLandmarks, handPresentLandmarks } from './helpers/gestures'
import { reachDrawPageSolo, sendHandFrame } from './helpers/game'

async function countPaintedPixels(canvas: Locator): Promise<number> {
    return canvas.evaluate((el: HTMLCanvasElement) => {
        const ctx = el.getContext('2d')!
        const { data } = ctx.getImageData(0, 0, el.width, el.height)
        let count = 0
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) count++
        }
        return count
    })
}

test('pinch draws a stroke; releasing the pinch stops extending it', async ({ page }) => {
    await reachDrawPageSolo(page, 'DrawTester')
    await page.getByRole('button', { name: 'Start Drawing' }).click()

    const canvas = page.locator('canvas').nth(1)
    await expect(canvas).toBeVisible()

    expect(await countPaintedPixels(canvas)).toBe(0)

    for (let i = 0; i <= 10; i++) {
        const x = 0.2 + (i / 10) * 0.5
        await sendHandFrame(page, pinchLandmarks(x, 0.5), 'PINCH')
        await page.waitForTimeout(16)
    }

    const paintedAfterPinch = await countPaintedPixels(canvas)
    expect(paintedAfterPinch).toBeGreaterThan(0)

    for (let i = 0; i <= 5; i++) {
        const x = 0.7 + (i / 10) * 0.2
        await sendHandFrame(page, handPresentLandmarks(x, 0.5), 'HAND_PRESENT')
        await page.waitForTimeout(16)
    }
    expect(await countPaintedPixels(canvas)).toBe(paintedAfterPinch)

    await sendHandFrame(page, null, 'NO_HAND')
    await page.waitForTimeout(16)
    expect(await countPaintedPixels(canvas)).toBe(paintedAfterPinch)
})