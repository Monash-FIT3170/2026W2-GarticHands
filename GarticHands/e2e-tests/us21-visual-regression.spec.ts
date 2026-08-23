import { test, expect } from '@playwright/test'

/**
 * User Story 21: As a player, I want the game to be visually appealing to
 * look at.
 *
 * Screenshot baselines for the core static routes catch unintended visual
 * regressions. On first run Playwright records the baseline; subsequent runs
 * fail if the rendered page drifts beyond the default pixel-diff threshold.
 */
test.describe('visual regression baselines', () => {
    test('landing page', async ({ page }) => {
        await page.goto('/')
        await expect(page).toHaveScreenshot('landing-page.png')
    })

    test('host lobby', async ({ page }) => {
        await page.goto('/')
        await page.getByPlaceholder('Enter username...').fill('player1')
        await page.getByRole('button', { name: 'Host Game' }).click()
        await expect(page).toHaveURL('/host')
        await expect(page).toHaveScreenshot('host-lobby.png')
    })

    test('join page', async ({ page }) => {
        await page.goto('/')
        await page.getByPlaceholder('Enter username...').fill('player1')
        await page.getByRole('button', { name: 'Join Room' }).click()
        await expect(page).toHaveURL('/join')
        await expect(page).toHaveScreenshot('join-page.png')
    })
})
