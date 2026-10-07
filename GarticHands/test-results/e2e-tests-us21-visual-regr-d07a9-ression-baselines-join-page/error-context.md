# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-tests/us21-visual-regression.spec.ts >> visual regression baselines >> join page
- Location: e2e-tests/us21-visual-regression.spec.ts:31:5

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | /**
  4  |  * User Story 21: As a player, I want the game to be visually appealing to
  5  |  * look at.
  6  |  *
  7  |  * Screenshot baselines for the core static routes catch unintended visual
  8  |  * regressions. On first run Playwright records the baseline; subsequent runs
  9  |  * fail if the rendered page drifts beyond the default pixel-diff threshold.
  10 |  */
  11 | test.describe('visual regression baselines', () => {
  12 |     test('landing page', async ({ page }) => {
  13 |         await page.goto('/')
  14 |         await expect(page).toHaveScreenshot('landing-page.png', { maxDiffPixels: 1000 })
  15 |     })
  16 | 
  17 |     test('host lobby', async ({ page }) => {
  18 |         await page.goto('/')
  19 |         await page.getByPlaceholder('Enter username...').fill('player1')
  20 |         await page.getByRole('button', { name: /Classic Play with friends/ }).click()
  21 |         await page.getByRole('button', { name: 'Host Game', exact: true }).click()
  22 |         await expect(page).toHaveURL('/host')
  23 |         // The displayed room code is random per run, so it must be masked out
  24 |         // of the comparison — otherwise no baseline can ever match twice.
  25 |         await expect(page).toHaveScreenshot('host-lobby.png', {
  26 |             mask: [page.locator('p.font-mono')],
  27 |             maxDiffPixels: 1000,
  28 |         })
  29 |     })
  30 | 
  31 |     test('join page', async ({ page }) => {
> 32 |         await page.goto('/')
     |                    ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  33 |         await page.getByPlaceholder('Enter username...').fill('player1')
  34 |         await page.getByRole('button', { name: /Classic Play with friends/ }).click()
  35 |         await page.getByRole('button', { name: 'Join Room', exact: true }).click()
  36 |         await expect(page).toHaveURL('/join')
  37 |         await expect(page).toHaveScreenshot('join-page.png', { maxDiffPixels: 1000 })
  38 |     })
  39 | })
```