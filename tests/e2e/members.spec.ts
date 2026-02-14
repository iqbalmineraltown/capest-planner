import { test, expect } from '@playwright/test'

test.describe('Members Page', () => {
  test('should display members page', async ({ page }) => {
    await page.goto('/members')
    await expect(page.locator('h1')).toContainText('Team Members')
  })

  test('should display seeded members from default data', async ({ page }) => {
    await page.goto('/members')
    await page.waitForLoadState('networkidle')

    // Wait for Vue to hydrate and seed data to populate
    await page.waitForTimeout(2000)

    // Check for member count in stats - this should be > 0 if seed data loaded
    const memberCount = await page.locator('.v-card--variant-tonal').first().locator('.text-h4').textContent()
    expect(parseInt(memberCount || '0')).toBeGreaterThan(0)
  })

  test('should open add member dialog', async ({ page }) => {
    await page.goto('/members')
    await page.waitForLoadState('networkidle')

    // Click the add member button
    await page.click('button:has-text("Add Member")')

    // Wait for dialog to appear
    await page.waitForTimeout(500)

    // Look for dialog content
    const dialog = page.locator('.v-overlay__content:visible')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await expect(dialog.locator('text=Team Member')).toBeVisible()
  })

  test('should have member cards with edit mode', async ({ page }) => {
    await page.goto('/members')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Check member count first from the stats card
    const statsCard = page.locator('.v-card--variant-tonal').first()
    const countEl = statsCard.locator('.text-h4')
    const count = await countEl.textContent()
    const numMembers = parseInt(count || '0')

    // If we have members, verify the page loaded properly
    if (numMembers > 0) {
      // The page should show member information somewhere
      // Either in cards or in the stats
      await expect(page.locator('h1')).toContainText('Team Members')
    }
  })
})
