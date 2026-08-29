import { test, expect } from '@playwright/test'
import { playRoundUI } from './helpers/game'

/**
 * User Story 9: As a player, I want to be able to see a slideshow of all the
 * prompts and drawings that occurred during the game, once the rounds have
 * concluded.
 *
 * Drives two real players through the full lobby -> prompt -> draw -> guess
 * flow via the UI (no API seeding, no direct navigation) until they land on
 * `/game` in the 'reveal' phase, then exercises the Slideshow tab: first
 * slide, manual Next/Prev, and `page.clock`-driven auto-advance every 4s.
 */
test('slideshow cycles through every drawing/prompt/guess, manually and automatically', async ({ browser }) => {
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

    await playerPage.getByRole('button', { name: 'Ready Up' }).click()
    await hostPage.getByRole('button', { name: 'Start Game' }).click()

    await Promise.all([
        playRoundUI(hostPage, "host's prompt", "host's guess"),
        playRoundUI(playerPage, "joiner's prompt", "joiner's guess"),
    ])

    await expect(hostPage.getByRole('heading', { name: 'Reveal' })).toBeVisible()

    // Install the clock only now — the app's own polling/countdown timers
    // above must keep running in real time to actually reach reveal.
    await hostPage.clock.install()
    await hostPage.getByRole('button', { name: 'Slideshow' }).click()

    // First slide.
    await expect(hostPage.getByText('1 / 2')).toBeVisible()
    const firstDrawer = await hostPage.locator('span.font-semibold').first().innerText()
    expect(['HostPlayer', 'JoinerPlayer']).toContain(firstDrawer)

    await hostPage.getByRole('button', { name: 'Next' }).click()
    await expect(hostPage.getByText('2 / 2')).toBeVisible()
    const secondDrawer = await hostPage.locator('span.font-semibold').first().innerText()
    expect(secondDrawer).not.toBe(firstDrawer)

    await hostPage.getByRole('button', { name: 'Prev' }).click()
    await expect(hostPage.getByText('1 / 2')).toBeVisible()

    // Auto-advance: 4s per slide.
    await hostPage.clock.fastForward(4000)
    await expect(hostPage.getByText('2 / 2')).toBeVisible()

    await hostContext.close()
    await playerContext.close()
})

