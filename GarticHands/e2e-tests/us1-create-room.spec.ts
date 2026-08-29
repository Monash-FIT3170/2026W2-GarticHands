import { test, expect } from '@playwright/test'

/**
 * User Story 1: As a player, I want to be able to create rooms to play the
 * game with other people.
 *
 * Host enters a name on `/`, clicks Host, lands on `/host`, and sees their
 * own name at the top of the player list.
 */
test('host can create a room and sees their name in the lobby', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('Enter username...').fill('player1')
    await page.getByRole('button', { name: 'Host Game' }).click()

    await expect(page).toHaveURL('/host')

    const playerRows = page.locator('p.font-bold.truncate')
    await expect(playerRows.first()).toHaveText('player1')
})
