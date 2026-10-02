import { test, expect } from '@playwright/test'
import { pinchLandmarks } from './helpers/gestures'
import { reachDrawPageSolo, sendHandFrame } from './helpers/game'
import { RoomApi } from './helpers/api'

test('a live stroke appears while drawing and is preserved on submit', async ({ page, request }) => {
    const roomCode = await reachDrawPageSolo(page, 'LiveDrawTester')
    await page.getByRole('button', { name: 'Start Drawing' }).click()

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
        await page.waitForTimeout(16)
    }

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
    expect(submittedDrawing.length).toBeGreaterThan(1000)
})