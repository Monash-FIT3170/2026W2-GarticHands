import { test, expect } from '@playwright/test'
import { RoomApi } from './helpers/api'

/**
 * User Story 16: As a room host, I do not want to be able to start a game if
 * someone is in the lobby and has indicated they are not ready.
 *
 * UI: after a player joins but before readying, the host's start button is
 * disabled and labelled "Waiting for Players".
 *
 * Server: `PATCH /rooms/:code/start` *should* return 409 when not everyone is
 * ready, but `server/index.js` currently starts the game unconditionally —
 * a known bug. That assertion is marked `test.fail()` so it documents the bug
 * without breaking the suite; if it starts failing (in a good way, i.e. the
 * assertion now passes), remove `test.fail()`.
 */
test('host cannot start the game via the UI while a player is not ready', async ({ browser }) => {
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

    const waitingButton = hostPage.getByRole('button', { name: 'Waiting for Players' })
    await expect(waitingButton).toBeVisible({ timeout: 5000 })
    await expect(waitingButton).toBeDisabled()

    await hostContext.close()
    await playerContext.close()
})

test.fail(
    'PATCH /rooms/:code/start rejects starting while a player is not ready (known bug)',
    async ({ request }) => {
        const api = new RoomApi(request)
        const created = await api.createRoom('HostPlayer')
        await api.joinRoom(created.roomCode, 'JoinerPlayer')
        // JoinerPlayer is never marked ready.

        const { status } = await api.start(created.roomCode)
        expect(status).toBe(409)
    },
)
