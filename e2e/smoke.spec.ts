import { test, expect } from '@playwright/test'

test('app loads and renders root element', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#root')).toBeVisible()
})
