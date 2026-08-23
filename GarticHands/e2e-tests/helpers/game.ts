import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import type { Landmark } from './gestures'

/** Waits for the hand-tracking seam to be wired up, then sends one synthetic frame. */
export async function sendHandFrame(page: Page, landmarks: Landmark[] | null, gesture: string) {
    await page.waitForFunction(() => !!(window as unknown as GhWindow).__ghTestHooks?.injectHandFrame)
    await page.evaluate(
        ({ landmarks, gesture }) => {
            ; (window as unknown as GhWindow).__ghTestHooks?.injectHandFrame?.(landmarks, gesture)
        },
        { landmarks, gesture },
    )
}

/**
 * Enables the `useHandTracking` test seam (bypasses the real camera/MediaPipe
 * pipeline) for the lifetime of this page's session. Must be called before
 * the first `page.goto()` so it's set before `/draw` ever mounts.
 */
export async function enableHandTrackingTestSeam(page: Page) {
    await page.addInitScript(() => {
        window.sessionStorage.setItem('gh:e2eHands', '1')
    })
}

/** Minimal shape of the test-only global exposed by `useHandTracking.ts`. */
interface GhWindow {
    __ghTestHooks?: {
        injectHandFrame?: (landmarks: Landmark[] | null, gesture: string) => void
    }
}

/**
 * Solo host-only flow from the landing page all the way to `/draw`: host a
 * room (a lone host is always "ready"), start it, submit the prompt, and land
 * on the drawing page with the hand-tracking test seam already enabled.
 * Returns the room code (read via the "Copy Room Code" clipboard action).
 */
export async function reachDrawPageSolo(page: Page, hostName: string): Promise<string> {
    await enableHandTrackingTestSeam(page)

    await page.goto('/')
    await page.getByPlaceholder('Enter username...').fill(hostName)
    await page.getByRole('button', { name: 'Host Game' }).click()
    await expect(page).toHaveURL('/host')

    await page.getByRole('button', { name: 'Copy Room Code' }).click()
    const roomCode = await page.evaluate(() => navigator.clipboard.readText())

    await page.getByRole('button', { name: 'Start Game' }).click()
    await expect(page).toHaveURL('/input', { timeout: 5000 })

    await page.locator('input.text.box').fill('a fixture prompt')
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page).toHaveURL('/draw', { timeout: 5000 })
    return roomCode
}

/** On `/input`: types and submits a prompt. */
export async function submitPromptUI(page: Page, prompt: string) {
    await page.locator('input.text.box').fill(prompt)
    await page.getByRole('button', { name: 'Submit' }).click()
}

/**
 * On `/draw`: waits long enough for the real (fake-camera-fed) recorder to
 * collect at least one chunk, then submits the drawing as-is (a blank canvas
 * is still a valid `data:image/...` payload the server accepts).
 */
export async function submitDrawingUI(page: Page) {
    await page.waitForTimeout(1500)
    await page.getByRole('button', { name: 'Submit Drawing' }).click()
}

/** On `/guess`: types and submits a guess. */
export async function submitGuessUI(page: Page, guess: string) {
    await page.getByPlaceholder('What is this drawing?').fill(guess)
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