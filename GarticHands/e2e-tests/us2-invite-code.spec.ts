import { test, expect } from '@playwright/test'

/**
 * User Story 2: As a player, I want to be able to generate invite codes so
 * that I can play with specific people.
 *
 * On `/host`, clicking "Copy Room Code" copies a 6-char alphanumeric code
 * (matching the server's `generateRoomCode()`) to the clipboard.
 */
test('host can copy a 6-character invite code to the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.goto('/')
    await page.getByPlaceholder('Enter username...').fill('player1')
    await page.getByRole('button', { name: 'Host Game' }).click()
    await expect(page).toHaveURL('/host')

    await page.getByRole('button', { name: 'Copy Room Code' }).click()
    await expect(page.getByText('Invite code copied!')).toBeVisible()

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toMatch(/^[A-Z0-9]{6}$/)
})
