import { test, expect } from '@playwright/test'

test('landing page shows the logo component', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByAltText('GarticHand logo')).toBeVisible()
  await expect(page.getByAltText('The Telephone Hand Game')).toBeVisible()
})