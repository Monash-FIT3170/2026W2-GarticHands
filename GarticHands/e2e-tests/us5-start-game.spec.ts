import { test, expect } from '@playwright/test'

/**
 * User Story 5: As a room host, I want to be able to start the game once all
 * players have indicated they are ready.
 *
 * All players ready -> "Start Game" enables -> clicking it navigates both the
 * host and the player to `/input`.
 */
test('host can start the game once all players are ready, navigating everyone to /input', async ({ browser }) => {
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

    const startButton = hostPage.getByRole('button', { name: 'Waiting for Players' })
    await expect(startButton).toBeDisabled()

    await playerPage.getByRole('button', { name: 'Ready Up' }).click()

    const enabledStart = hostPage.getByRole('button', { name: 'Start Game' })
    await expect(enabledStart).toBeEnabled({ timeout: 5000 })
    await enabledStart.click()

    await expect(hostPage).toHaveURL('/input', { timeout: 5000 })
    await expect(playerPage).toHaveURL('/input', { timeout: 5000 })

    await hostContext.close()
    await playerContext.close()
})
