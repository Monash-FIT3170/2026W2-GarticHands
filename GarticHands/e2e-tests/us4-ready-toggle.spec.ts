import { test, expect } from '@playwright/test'

/**
 * User Story 4: As a player, I want to be able to opt in to be ready when I
 * am prepared to play.
 *
 * Player clicks Ready Up; text becomes "Ready", the player list status
 * updates, and every player sees 2/2 ready. Clicking again reverts to
 * waiting.
 */
test('a player can toggle ready status and both lobbies reflect it', async ({ browser }) => {
    const hostContext = await browser.newContext()
    const hostPage = await hostContext.newPage()
    await hostPage.goto('/')
    await hostPage.getByPlaceholder('Enter username...').fill('HostPlayer')
    await hostPage.getByRole('button', { name: 'Host Game' }).click()
    await expect(hostPage).toHaveURL('/host')

    await hostPage.getByRole('button', { name: 'Copy Room Code' }).click()
    const roomCode = await hostPage.evaluate(() => navigator.clipboard.readText())

    const playerContext = await browser.newContext()
    const playerPage = await playerContext.newPage()
    await playerPage.goto('/')
    await playerPage.getByPlaceholder('Enter username...').fill('JoinerPlayer')
    await playerPage.getByRole('button', { name: 'Join Room' }).click()
    await playerPage.getByPlaceholder('ABC123').fill(roomCode)
    await playerPage.getByRole('button', { name: 'Join Game' }).click()
    await expect(playerPage).toHaveURL(`/joined/${roomCode}`)

    const readyButton = playerPage.getByRole('button', { name: 'Ready Up' })
    await expect(readyButton).toBeVisible()

    await readyButton.click()
    await expect(playerPage.getByRole('button', { name: 'Ready', exact: true })).toBeVisible()

    await expect(playerPage.getByText('2/2 ready')).toBeVisible()
    await expect(hostPage.getByText('2/2 ready')).toBeVisible({ timeout: 5000 })

    await playerPage.getByRole('button', { name: 'Ready', exact: true }).click()
    await expect(playerPage.getByRole('button', { name: 'Ready Up' })).toBeVisible()
    await expect(playerPage.getByText('1/2 ready')).toBeVisible()

    await hostContext.close()
    await playerContext.close()
})
