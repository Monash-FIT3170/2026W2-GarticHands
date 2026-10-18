import { test, expect } from '@playwright/test'

/**
 * User Story 1: As a player, I want to be able to create rooms to play the
 * game with other people.
 *
 * Host enters a name on `/`, clicks Host Game, lands in a Classic room on
 * `/host`, and sees their own name at the top of the player list.
 */
test('host can create a room and sees their name in the lobby', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('Enter username...').fill('player1')

    await page.getByRole('button', { name: 'Host Game', exact: true }).click()

    await expect(page).toHaveURL('/host')

    const playerRows = page.locator('p.font-bold.truncate')
    await expect(playerRows.first()).toHaveText('player1')
})
test('host picks the game mode from the lobby list', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('Enter username...').fill('player1')
    await page.getByRole('button', { name: 'Host Game', exact: true }).click()
    await expect(page).toHaveURL('/host')

    const classic = page.getByRole('button', { name: 'Classic', exact: true })
    const showdown = page.getByRole('button', { name: 'Showdown', exact: true })
    await expect(classic).toHaveAttribute('aria-pressed', 'true')

    await showdown.hover()
    await expect(page.getByRole('tooltip')).toContainText('Compete across multiple rounds')

    await showdown.click()
    await expect(showdown).toHaveAttribute('aria-pressed', 'true')
    await expect(classic).toHaveAttribute('aria-pressed', 'false')

    const aiShowdown = page.getByRole('button', { name: 'AI Showdown', exact: true })
    await aiShowdown.click()
    await expect(aiShowdown).toHaveAttribute('aria-pressed', 'true')
    await expect(showdown).toHaveAttribute('aria-pressed', 'false')

    // The choice is saved on the room, so it survives the lobby's next poll.
    await page.waitForTimeout(1500)
    await expect(aiShowdown).toHaveAttribute('aria-pressed', 'true')
})
