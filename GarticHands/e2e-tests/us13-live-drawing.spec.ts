import { test, expect } from '@playwright/test'
import { pinchLandmarks } from './helpers/gestures'
import { reachDrawPageSolo, sendHandFrame } from './helpers/game'
import { RoomApi } from './helpers/api'

/**
 * User Story 13: As a player, I want to be able to see my drawing come to
 * life as I am in the middle of drawing it.
 *
 * Injects deterministic pinch frames, samples canvas pixels to confirm a
 * stroke appears live (before Submit Drawing), then submits and asserts the
 * server stored a matching (non-blank) drawing.
 */
test('a live stroke appears while drawing and is preserved on submit', async ({ page, request }) => {
    const roomCode = await reachDrawPageSolo(page, 'LiveDrawTester')

    // Default draw mode is 'split': [camera-overlay canvas, primary draw canvas, cursor canvas].
    const canvas = page.locator('canvas').nth(1)

    async function countPaintedPixels() {
        return canvas.evaluate((el: HTMLCanvasElement) => {
            const ctx = el.getContext('2d')!
            const { data } = ctx.getImageData(0, 0, el.width, el.height)
            let count = 0
            for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++
            return count
        })
    }

    expect(await countPaintedPixels()).toBe(0)

    for (let i = 0; i <= 10; i++) {
        const t = i / 10
        await sendHandFrame(page, pinchLandmarks(0.25 + t * 0.5, 0.3 + t * 0.4), 'PINCH')
    }

    // Stroke is visible live, before submitting.
    const paintedBeforeSubmit = await countPaintedPixels()
    expect(paintedBeforeSubmit).toBeGreaterThan(0)

    await page.getByRole('button', { name: 'Submit Drawing' }).click()

    const api = new RoomApi(request)
    await expect
        .poll(async () => {
            const { room } = await api.getRoom(roomCode)
            return room?.drawings?.['LiveDrawTester']
        }, { timeout: 5000 })
        .toBeTruthy()

    const { room } = await api.getRoom(roomCode)
    const submittedDrawing = room.drawings['LiveDrawTester']
    expect(submittedDrawing.startsWith('data:image/')).toBe(true)
    // A blank 640x480 PNG is a few hundred bytes; a stroke pushes this well past that.
    expect(submittedDrawing.length).toBeGreaterThan(1000)
})
