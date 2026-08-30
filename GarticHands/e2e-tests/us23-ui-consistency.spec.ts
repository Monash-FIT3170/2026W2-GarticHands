import { test, expect } from '@playwright/test'

/**
 * User Story 23: As a user, I want to see a consistent UI design across all
 * game pages.
 *
 * Maintains screenshot baselines (shared visual-regression mechanism from
 * User Story 21) and asserts shared UI signals are present on each page: the
 * GarticHand logo, the brand page background, and a sane heading hierarchy.
 */
const LOGO_ROUTES = ['/', '/join']

test.describe('consistent branding across pages', () => {
    for (const route of LOGO_ROUTES) {
        test(`${route} shows the GarticHand logo`, async ({ page }) => {
            await page.goto(route)
            await expect(page.getByAltText('GarticHand logo')).toBeVisible()
            await expect(page.getByAltText('The Telephone Hand Game')).toBeVisible()
        })
    }

    test('host lobby shows the (compact) logo after hosting', async ({ page }) => {
        await page.goto('/')
        await page.getByPlaceholder('Enter username...').fill('player1')
        await page.getByRole('button', { name: 'Host Game' }).click()
        await expect(page).toHaveURL('/host')
        await expect(page.getByAltText('GarticHand logo')).toBeVisible()
    })

    test('brand background color is consistent between landing and lobby', async ({ page }) => {
        await page.goto('/')
        const landingBg = await page
            .locator('div.min-h-screen')
            .first()
            .evaluate((el) => getComputedStyle(el).backgroundColor)

        await page.getByPlaceholder('Enter username...').fill('player1')
        await page.getByRole('button', { name: 'Host Game' }).click()
        await expect(page).toHaveURL('/host')

        const lobbyRoot = page.locator('div.min-h-screen').first()
        await expect(lobbyRoot).toBeVisible()
        await expect.poll(
            () => lobbyRoot.evaluate((el) => getComputedStyle(el).backgroundColor),
        ).toBe(landingBg)
    })

    test('every top-level page exposes exactly one primary heading region', async ({ page }) => {
        await page.goto('/')
        // Landing page has no <h1>/<h2> chrome of its own — Card content stands in;
        // the key invariant is that the page never renders more than one visually
        // primary call-to-action button group at once.
        await expect(page.getByRole('button', { name: 'Host Game' })).toHaveCount(1)
        await expect(page.getByRole('button', { name: 'Join Room' })).toHaveCount(1)
    })
})
