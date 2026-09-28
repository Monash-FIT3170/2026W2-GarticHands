# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-tests/us10-gesture-draw-stop.spec.ts >> pinch draws a stroke; releasing the pinch stops extending it
- Location: e2e-tests/us10-gesture-draw-stop.spec.ts:28:1

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  1  | import type { Page } from '@playwright/test'
  2  | import { expect } from '@playwright/test'
  3  | import type { Landmark } from './gestures'
  4  | 
  5  | /** Waits for the hand-tracking seam to be wired up, then sends one synthetic frame. */
  6  | export async function sendHandFrame(page: Page, landmarks: Landmark[] | null, gesture: string) {
  7  |     await page.waitForFunction(() => !!(window as unknown as GhWindow).__ghTestHooks?.injectHandFrame)
  8  |     await page.evaluate(
  9  |         ({ landmarks, gesture }) => {
  10 |             ; (window as unknown as GhWindow).__ghTestHooks?.injectHandFrame?.(landmarks, gesture)
  11 |         },
  12 |         { landmarks, gesture },
  13 |     )
  14 | }
  15 | 
  16 | /**
  17 |  * Enables the `useHandTracking` test seam (bypasses the real camera/MediaPipe
  18 |  * pipeline) for the lifetime of this page's session. Must be called before
  19 |  * the first `page.goto()` so it's set before `/draw` ever mounts.
  20 |  */
  21 | export async function enableHandTrackingTestSeam(page: Page) {
  22 |     await page.addInitScript(() => {
  23 |         window.sessionStorage.setItem('gh:e2eHands', '1')
  24 |     })
  25 | }
  26 | 
  27 | /** Minimal shape of the test-only global exposed by `useHandTracking.ts`. */
  28 | interface GhWindow {
  29 |     __ghTestHooks?: {
  30 |         injectHandFrame?: (landmarks: Landmark[] | null, gesture: string) => void
  31 |     }
  32 | }
  33 | 
  34 | /**
  35 |  * Solo host-only flow from the landing page all the way to `/draw`: host a
  36 |  * room (a lone host is always "ready"), start it, submit the prompt, and land
  37 |  * on the drawing page with the hand-tracking test seam already enabled.
  38 |  * Returns the room code (read via the "Copy Room Code" clipboard action).
  39 |  */
  40 | export async function reachDrawPageSolo(page: Page, hostName: string): Promise<string> {
  41 |     await enableHandTrackingTestSeam(page)
  42 | 
> 43 |     await page.goto('/')
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  44 |     await page.getByPlaceholder('Enter username...').fill(hostName)
  45 |     await page.getByRole('button', { name: 'Host Game' }).click()
  46 |     await expect(page).toHaveURL('/host')
  47 | 
  48 |     await page.getByRole('button', { name: 'Copy Room Code' }).click()
  49 |     const roomCode = await page.evaluate(() => navigator.clipboard.readText())
  50 | 
  51 |     await page.getByRole('button', { name: 'Start Game' }).click()
  52 |     await expect(page).toHaveURL('/input', { timeout: 5000 })
  53 | 
  54 |     await page.locator('input.text.box').fill('a fixture prompt')
  55 |     await page.getByRole('button', { name: 'Submit' }).click()
  56 | 
  57 |     await expect(page).toHaveURL('/draw', { timeout: 5000 })
  58 |     return roomCode
  59 | }
  60 | 
  61 | /** On `/input`: types and submits a prompt. */
  62 | export async function submitPromptUI(page: Page, prompt: string) {
  63 |     await page.locator('input.text.box').fill(prompt)
  64 |     await page.getByRole('button', { name: 'Submit' }).click()
  65 | }
  66 | 
  67 | /**
  68 |  * On `/draw`: waits long enough for the real (fake-camera-fed) recorder to
  69 |  * collect at least one chunk, then submits the drawing as-is (a blank canvas
  70 |  * is still a valid `data:image/...` payload the server accepts).
  71 |  */
  72 | export async function submitDrawingUI(page: Page) {
  73 |     await page.waitForTimeout(1500)
  74 |     await page.getByRole('button', { name: 'Submit Drawing' }).click()
  75 | }
  76 | 
  77 | /** On `/guess`: types and submits a guess. */
  78 | export async function submitGuessUI(page: Page, guess: string) {
  79 |     await page.getByPlaceholder('What is this drawing?').fill(guess)
  80 |     await page.getByRole('button', { name: 'Submit Guess' }).click()
  81 | }
  82 | 
  83 | /** Drives one full prompt -> draw -> guess round for a single page, starting on `/input`. */
  84 | export async function playRoundUI(page: Page, prompt: string, guess: string) {
  85 |     await expect(page).toHaveURL('/input', { timeout: 10_000 })
  86 |     await submitPromptUI(page, prompt)
  87 | 
  88 |     await expect(page).toHaveURL('/draw', { timeout: 10_000 })
  89 |     await submitDrawingUI(page)
  90 | 
  91 |     await expect(page).toHaveURL('/guess', { timeout: 10_000 })
  92 |     await submitGuessUI(page, guess)
  93 | 
  94 |     await expect(page).toHaveURL('/game', { timeout: 10_000 })
  95 | }
```