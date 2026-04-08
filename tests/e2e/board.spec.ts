import { test, expect } from '@playwright/test'

test.describe('Capacity Board Page', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and localStorage to ensure fresh data
    await page.context().clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
    })
    await page.goto('/board')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  test('should display board page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Capacity Board')
  })

  test('should display member pool sidebar', async ({ page }) => {
    // Should show Team Pool sidebar
    await expect(page.locator('text=Team Pool')).toBeVisible({ timeout: 10000 })

    // Should show some members in the pool (seed data has crew members)
    const memberPool = page.locator('.member-pool-card')
    const count = await memberPool.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should display board with initiative header', async ({ page }) => {
    // Should show Initiative column header in the board
    await expect(page.locator('.board-week-header__label:has-text("Initiative")').first()).toBeVisible({ timeout: 10000 })

    // Should show quarter summary info
    await expect(page.locator('.quarter-summary-bar').first()).toBeVisible()
  })

  test('should display quarter selector', async ({ page }) => {
    // Should have quarter selector dropdown
    const quarterSelect = page.locator('.v-select').first()
    await expect(quarterSelect).toBeVisible({ timeout: 10000 })
  })

  test('should have add quarter button', async ({ page }) => {
    // Should have Add Quarter button
    await expect(page.locator('button:has-text("Add Quarter")')).toBeVisible({ timeout: 5000 })
  })

  test('should allow drag and drop from member pool', async ({ page }) => {
    // Get member pool cards
    const memberCard = page.locator('.member-pool-card').first()
    await expect(memberCard).toBeVisible({ timeout: 10000 })

    // Drag member card to week column
    await memberCard.dragTo(page.locator('.week-column').first())
    await page.waitForTimeout(1000)
  })
})