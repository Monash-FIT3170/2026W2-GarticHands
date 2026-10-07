import { test, expect } from '@playwright/test'
import { submitDrawingUI, submitGuessUI, submitPromptUI } from './helpers/game.js'

const CLIENT_URL = 'http://localhost:5173'

test('My Recordings shows a playable replay per round and Next advances between them', async ({ page, browser }) => {
    test.setTimeout(90_000)

    const hostPage = page

    const playerContext = await browser.newContext()
    const playerPage = await playerContext.newPage()

    const thirdPlayerContext = await browser.newContext()
    const thirdPlayerPage = await thirdPlayerContext.newPage()

    // Host creates the room.
    await hostPage.goto(CLIENT_URL)
    await hostPage.getByPlaceholder('Enter username...').fill('RecorderHost')
    await hostPage.getByRole('button', { name: /Classic Play with friends/ }).click()
    await hostPage.getByRole('button', { name: 'Host Game', exact: true }).click()
    await expect(hostPage).toHaveURL(`${CLIENT_URL}/host`)

    await hostPage.getByRole('button', { name: 'Copy Room Code' }).click()
    const roomCode = await hostPage.evaluate(() => navigator.clipboard.readText())
    await hostPage.getByRole('button', { name: 'OK', exact: true }).click()

    // Second player joins.
    await playerPage.goto(CLIENT_URL)
    await playerPage.getByPlaceholder('Enter username...').fill('RecorderPlayer2')
    await playerPage.getByRole('button', { name: /Classic Play with friends/ }).click()
    await playerPage.getByRole('button', { name: 'Join Room', exact: true }).click()
    await playerPage.getByPlaceholder('ABC123').fill(roomCode)
    await playerPage.getByRole('button', { name: 'Join Game' }).click()
    await expect(playerPage).toHaveURL(`${CLIENT_URL}/joined/${roomCode}`)

    // Third player joins.
    await thirdPlayerPage.goto(CLIENT_URL)
    await thirdPlayerPage.getByPlaceholder('Enter username...').fill('RecorderPlayer3')
    await thirdPlayerPage.getByRole('button', { name: /Classic Play with friends/ }).click()
    await thirdPlayerPage.getByRole('button', { name: 'Join Room', exact: true }).click()
    await thirdPlayerPage.getByPlaceholder('ABC123').fill(roomCode)
    await thirdPlayerPage.getByRole('button', { name: 'Join Game' }).click()
    await expect(thirdPlayerPage).toHaveURL(`${CLIENT_URL}/joined/${roomCode}`)

    // Both joining players ready up.
    await playerPage.getByRole('button', { name: 'Ready Up' }).click()
    await thirdPlayerPage.getByRole('button', { name: 'Ready Up' }).click()

    // Start the first round.
    await expect(hostPage.getByRole('button', { name: 'Start Game' })).toBeEnabled()
    await hostPage.getByRole('button', { name: 'Start Game' }).click()

    await Promise.all([
        expect(hostPage).toHaveURL(`${CLIENT_URL}/input`),
        expect(playerPage).toHaveURL(`${CLIENT_URL}/input`),
        expect(thirdPlayerPage).toHaveURL(`${CLIENT_URL}/input`),
    ])

    // Round 1: all three players submit prompts.
    await Promise.all([
        submitPromptUI(hostPage, 'first host prompt'),
        submitPromptUI(playerPage, 'first player two prompt'),
        submitPromptUI(thirdPlayerPage, 'first player three prompt'),
    ])

    await Promise.all([
        expect(hostPage).toHaveURL(`${CLIENT_URL}/draw`),
        expect(playerPage).toHaveURL(`${CLIENT_URL}/draw`),
        expect(thirdPlayerPage).toHaveURL(`${CLIENT_URL}/draw`),
    ])

    // Round 1: all three players submit drawings.
    await Promise.all([
        submitDrawingUI(hostPage),
        submitDrawingUI(playerPage),
        submitDrawingUI(thirdPlayerPage),
    ])

    await Promise.all([
        expect(hostPage).toHaveURL(`${CLIENT_URL}/guess`),
        expect(playerPage).toHaveURL(`${CLIENT_URL}/guess`),
        expect(thirdPlayerPage).toHaveURL(`${CLIENT_URL}/guess`),
    ])

    // Round 1: all three players submit guesses.
    await Promise.all([
        submitGuessUI(hostPage, 'first host guess'),
        submitGuessUI(playerPage, 'first player two guess'),
        submitGuessUI(thirdPlayerPage, 'first player three guess'),
    ])

    await Promise.all([
        expect(hostPage).toHaveURL(`${CLIENT_URL}/game`),
        expect(playerPage).toHaveURL(`${CLIENT_URL}/game`),
        expect(thirdPlayerPage).toHaveURL(`${CLIENT_URL}/game`),
    ])

    await expect(hostPage.getByRole('heading', { name: 'Reveal' })).toBeVisible()

    // Verify the first recording.
    await hostPage.getByRole('button', { name: /My Recordings \(1\)/ }).click()

    const video = hostPage.locator('video[controls]')

    await expect(video).toBeVisible()

    const src1 = await video.getAttribute('src')

    expect(src1).toMatch(/^blob:/)
    await expect(hostPage.getByText('Round 1 ·')).toBeVisible()

    // Start round 2.
    await hostPage.getByRole('button', { name: 'Play Round 2' }).click()

    await Promise.all([
        expect(hostPage).toHaveURL(`${CLIENT_URL}/input`),
        expect(playerPage).toHaveURL(`${CLIENT_URL}/input`),
        expect(thirdPlayerPage).toHaveURL(`${CLIENT_URL}/input`),
    ])

    // Round 2: all three players submit prompts.
    await Promise.all([
        submitPromptUI(hostPage, 'second host prompt'),
        submitPromptUI(playerPage, 'second player two prompt'),
        submitPromptUI(thirdPlayerPage, 'second player three prompt'),
    ])

    await Promise.all([
        expect(hostPage).toHaveURL(`${CLIENT_URL}/draw`),
        expect(playerPage).toHaveURL(`${CLIENT_URL}/draw`),
        expect(thirdPlayerPage).toHaveURL(`${CLIENT_URL}/draw`),
    ])

    // Round 2: all three players submit drawings.
    await Promise.all([
        submitDrawingUI(hostPage),
        submitDrawingUI(playerPage),
        submitDrawingUI(thirdPlayerPage),
    ])

    await Promise.all([
        expect(hostPage).toHaveURL(`${CLIENT_URL}/guess`),
        expect(playerPage).toHaveURL(`${CLIENT_URL}/guess`),
        expect(thirdPlayerPage).toHaveURL(`${CLIENT_URL}/guess`),
    ])

    // Round 2: all three players submit guesses.
    await Promise.all([
        submitGuessUI(hostPage, 'second host guess'),
        submitGuessUI(playerPage, 'second player two guess'),
        submitGuessUI(thirdPlayerPage, 'second player three guess'),
    ])

    await Promise.all([
        expect(hostPage).toHaveURL(`${CLIENT_URL}/game`),
        expect(playerPage).toHaveURL(`${CLIENT_URL}/game`),
        expect(thirdPlayerPage).toHaveURL(`${CLIENT_URL}/game`),
    ])

    await expect(hostPage.getByRole('heading', { name: 'Reveal' })).toBeVisible()

    // Verify both recordings exist.
    await hostPage.getByRole('button', { name: /My Recordings \(2\)/ }).click()

    await expect(video).toHaveAttribute('src', src1 as string)
    await expect(hostPage.getByText('Round 1 ·')).toBeVisible()

    await hostPage.getByRole('button', { name: 'Next' }).click()

    const src2 = await video.getAttribute('src')

    expect(src2).toMatch(/^blob:/)
    expect(src2).not.toBe(src1)
    await expect(hostPage.getByText('Round 2 ·')).toBeVisible()

    await playerContext.close()
    await thirdPlayerContext.close()
})