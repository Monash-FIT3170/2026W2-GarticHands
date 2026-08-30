import { test, expect } from '@playwright/test'
import { playRoundUI } from './helpers/game.js'

/**
 * User Story 15: As a player, I want to be able to see a replay of how the
 * drawing was made.
 *
 * Drives a solo host through two full rounds via the real UI (no API
 * seeding, no test-only injection): the app's own `useRecorder` records each
 * round against the fake camera device configured in `playwright.config.ts`.
 * Selects "My Recordings" and asserts a `<video controls>` with a real
 * `blob:` src per round, and that "Next" advances to the second recording.
 */
test('My Recordings shows a playable replay per round and Next advances between them', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto('/')
    await page.getByPlaceholder('Enter username...').fill('RecorderTester')
    await page.getByRole('button', { name: 'Host Game' }).click()
    await expect(page).toHaveURL('/host')
    await page.getByRole('button', { name: 'Start Game' }).click()

    await playRoundUI(page, 'first prompt', 'first guess')
    await expect(page.getByRole('heading', { name: 'Reveal' })).toBeVisible()

    await page.getByRole('button', { name: /My Recordings \(1\)/ }).click()
    const video = page.locator('video[controls]')
    await expect(video).toBeVisible()
    const src1 = await video.getAttribute('src')
    expect(src1).toMatch(/^blob:/)
    await expect(page.getByText('Round 1 ·')).toBeVisible()

    // Play a second round — not the final round (maxRounds is 4) — to get a second recording.
    await page.getByRole('button', { name: 'Play Round 2' }).click()
    await playRoundUI(page, 'second prompt', 'second guess')
    await expect(page.getByRole('heading', { name: 'Reveal' })).toBeVisible()

    await page.getByRole('button', { name: /My Recordings \(2\)/ }).click()
    await expect(video).toHaveAttribute('src', src1 as string)
    await expect(page.getByText('Round 1 ·')).toBeVisible()

    await page.getByRole('button', { name: 'Next' }).click()
    const src2 = await video.getAttribute('src')
    expect(src2).toMatch(/^blob:/)
    expect(src2).not.toBe(src1)
    await expect(page.getByText('Round 2 ·')).toBeVisible()
})

