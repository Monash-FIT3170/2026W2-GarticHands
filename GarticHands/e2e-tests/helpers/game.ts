import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import type { Landmark } from './gestures'

export async function sendHandFrame(page: Page, landmarks: Landmark[] | null, gesture: string) {
    await page.waitForFunction(() => !!(window as unknown as GhWindow).__ghTestHooks?.injectHandFrame)
    await page.evaluate(
        ({ landmarks, gesture }) => {
            ; (window as unknown as GhWindow).__ghTestHooks?.injectHandFrame?.(landmarks, gesture)
        },
        { landmarks, gesture },
    )
}

export async function enableHandTrackingTestSeam(page: Page) {
    await page.addInitScript(() => {
        window.sessionStorage.setItem('gh:e2eHands', '1')
    })
}

interface GhWindow {
    __ghTestHooks?: {
        injectHandFrame?: (landmarks: Landmark[] | null, gesture: string) => void
    }
}

/**
 * Drives a host through the landing page to `/draw` using two API-created
 * fixture players to satisfy Classic Mode's three-player minimum.
 */
export async function reachDrawPageSolo(page: Page, hostName: string): Promise<string> {
    await enableHandTrackingTestSeam(page)

    await page.goto('/')
    await page.getByPlaceholder('Enter username...').fill(hostName)
    await page.getByRole('button', { name: /Classic Play with friends/ }).click()
    await page.getByRole('button', { name: 'Host Game', exact: true }).click()
    await expect(page).toHaveURL('/host')

    await page.getByRole('button', { name: 'Copy Room Code' }).click()
    const roomCode = await page.evaluate(() => navigator.clipboard.readText())
    await page.getByRole('button', { name: 'OK', exact: true }).click()

    const apiBase = 'http://localhost:3000'

    for (const playerName of ['FixturePlayer2', 'FixturePlayer3']) {
        await page.evaluate(
            async ({ apiBase, roomCode, playerName }) => {
                const joinResponse = await fetch(`${apiBase}/rooms/join`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roomCode, playerName }),
                })

                if (!joinResponse.ok) {
                    throw new Error(`Failed to join fixture player ${playerName}`)
                }

                const readyResponse = await fetch(`${apiBase}/rooms/${roomCode}/ready`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ playerName, ready: true }),
                })

                if (!readyResponse.ok) {
                    throw new Error(`Failed to ready fixture player ${playerName}`)
                }
            },
            { apiBase, roomCode, playerName },
        )
    }

    // Wait for the host lobby to receive both fixture players.
    await expect(page.getByText('PLAYERS 3/8')).toBeVisible({ timeout: 5000 })

    const startButton = page.getByRole('button', {
        name: 'Start Game',
        exact: true,
    })

    await expect(startButton).toBeVisible({ timeout: 5000 })
    await expect(startButton).toBeEnabled({ timeout: 5000 })
    await startButton.click()

    await expect(page).toHaveURL('/input', { timeout: 5000 })

    // Submit the host's prompt through the real UI.
    await page.getByPlaceholder('What should they draw?').fill('a fixture prompt')
    await page.getByRole('button', { name: 'Submit' }).click()

    // Submit prompts for the fixture players after the game has started.
    for (const playerName of ['FixturePlayer2', 'FixturePlayer3']) {
        await page.evaluate(
            async ({ apiBase, roomCode, playerName }) => {
                const promptResponse = await fetch(`${apiBase}/rooms/${roomCode}/prompts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        playerName,
                        prompt: `fixture prompt from ${playerName}`,
                    }),
                })

                if (!promptResponse.ok) {
                    throw new Error(`Failed to submit prompt for ${playerName}`)
                }
            },
            { apiBase, roomCode, playerName },
        )
    }

    await expect(page).toHaveURL('/draw', { timeout: 5000 })

    return roomCode
}

/** On `/input`: types and submits a prompt. */
export async function submitPromptUI(page: Page, prompt: string) {
    await page.getByPlaceholder('What should they draw?').fill(prompt)
    await page.getByRole('button', { name: 'Submit' }).click()
}

/**
 * On `/draw`: waits long enough for the real (fake-camera-fed) recorder to
 * collect at least one chunk, then submits the drawing as-is.
 */
export async function submitDrawingUI(page: Page) {
    await page.waitForTimeout(1500)
    await page.getByRole('button', { name: 'Submit Drawing' }).click()
}

/** On `/guess`: types and submits a guess. */
export async function submitGuessUI(page: Page, guess: string) {
    await page.getByPlaceholder('Type your guess here...').fill(guess)
    await page.getByRole('button', { name: 'Submit Guess' }).click()
}

/** Drives one full prompt -> draw -> guess round for a single page, starting on `/input`. */
export async function playRoundUI(page: Page, prompt: string, guess: string) {
    await expect(page).toHaveURL('/input', { timeout: 10_000 })
    await submitPromptUI(page, prompt)

    await expect(page).toHaveURL('/draw', { timeout: 10_000 })
    await submitDrawingUI(page)

    await expect(page).toHaveURL('/guess', { timeout: 10_000 })
    await submitGuessUI(page, guess)

    await expect(page).toHaveURL('/game', { timeout: 10_000 })
}