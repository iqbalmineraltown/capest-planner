import { test, expect } from '@playwright/test'

test.describe('Capacity Board Page', () => {
  test('should display board page', async ({ page }) => {
    await page.goto('/board')
    await expect(page.locator('h1')).toContainText('Capacity Board')
  })

  test('should display member pool with available crew', async ({ page }) => {
    await page.goto('/board')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Should show member pool section
    await expect(page.locator('text=Available Crew')).toBeVisible({ timeout: 10000 })

    // Should show some members in the pool (seed data has crew members)
    const memberPool = page.locator('.member-pool-card')
    const count = await memberPool.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should display board with seeded initiatives', async ({ page }) => {
    await page.goto('/board')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Should show capacity allocation section - use exact match to avoid strict mode
    await expect(page.locator('span:has-text("Capacity Allocation")').first()).toBeVisible({ timeout: 10000 })

    // Should show initiatives count chip (e.g., "5 initiatives")
    await expect(page.locator('.v-chip:has-text("initiatives")').first()).toBeVisible()
  })

  test('should display quarter selector', async ({ page }) => {
    await page.goto('/board')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Should have quarter selector dropdown
    const quarterSelect = page.locator('.v-select').first()
    await expect(quarterSelect).toBeVisible({ timeout: 10000 })
  })

  test('should have add quarter button', async ({ page }) => {
    await page.goto('/board')
    await page.waitForLoadState('networkidle')

    // Should have Add Quarter button
    await expect(page.locator('button:has-text("Add Quarter")')).toBeVisible({ timeout: 5000 })
  })

  test('should allow drag and drop from member pool', async ({ page }) => {
    await page.goto('/board')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Get member pool cards
    const memberCard = page.locator('.member-pool-card').first()
    await expect(memberCard).toBeVisible({ timeout: 10000 })

    // Member cards should be draggable
    const isDraggable = await memberCard.getAttribute('draggable')
    expect(isDraggable).toBe('true')
  })
})
