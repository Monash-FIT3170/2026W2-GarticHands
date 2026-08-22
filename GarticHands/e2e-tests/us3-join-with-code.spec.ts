import { test, expect } from '@playwright/test'

/**
 * User Story 3: As a player, I want to be able to use an invite code to join
 * a specific room.
 *
 * Host creates a room and reads its code (via "Copy Room Code" + clipboard).
 * A second player enters their name, joins with that code, lands on
 * `/joined/:code`, and both lobbies show both player names.
 */
test('a player can join a room using the host-provided invite code', async ({ browser }) => {
    const hostContext = await browser.newContext({
        permissions: ['clipboard-read', 'clipboard-write'],
    })
    const hostPage = await hostContext.newPage()

    await hostPage.goto('/')
    await hostPage.getByPlaceholder('Enter username...').fill('HostPlayer')
    await hostPage.getByRole('button', { name: 'Host Game' }).click()
    await expect(hostPage).toHaveURL('/host')

    await hostPage.getByRole('button', { name: 'Copy Room Code' }).click()
    const roomCode = await hostPage.evaluate(() => navigator.clipboard.readText())
    expect(roomCode).toMatch(/^[A-Z0-9]{6}$/)

    const playerContext = await browser.newContext()
    const playerPage = await playerContext.newPage()

    await playerPage.goto('/')
    await playerPage.getByPlaceholder('Enter username...').fill('JoinerPlayer')
    await playerPage.getByRole('button', { name: 'Join Room' }).click()
    await expect(playerPage).toHaveURL('/join')

    await playerPage.getByPlaceholder('ABC123').fill(roomCode)
    await playerPage.getByRole('button', { name: 'Join Game' }).click()

    await expect(playerPage).toHaveURL(`/joined/${roomCode}`)
    await expect(playerPage.getByText('HostPlayer')).toBeVisible()
    await expect(playerPage.getByText('JoinerPlayer')).toBeVisible()

    // Host's lobby (polls every 1s) should pick up the new joiner too.
    await expect(hostPage.getByText('JoinerPlayer')).toBeVisible({ timeout: 5000 })
    await expect(hostPage.getByText('HostPlayer')).toBeVisible()

    await hostContext.close()
    await playerContext.close()
})
