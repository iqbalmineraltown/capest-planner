import { test, expect } from '@playwright/test'

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  test('should display settings page with all sections', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Settings')

    // All 5 sections should be visible
    await expect(page.getByText('Role Management')).toBeVisible()
    await expect(page.getByText('Quarter Management')).toBeVisible()
    await expect(page.getByText('Data Management')).toBeVisible()
    await expect(page.getByText('Theme Preferences')).toBeVisible()
    await expect(page.getByText('About')).toBeVisible()
  })

  test('should display default roles with chips', async ({ page }) => {
    // Default roles should be visible
    await expect(page.locator('.v-chip:has-text("BE")').first()).toBeVisible()
    await expect(page.locator('.v-chip:has-text("FE")').first()).toBeVisible()
    await expect(page.locator('.v-chip:has-text("MOBILE")').first()).toBeVisible()
    await expect(page.locator('.v-chip:has-text("QA")').first()).toBeVisible()
  })

  test('should add a custom role', async ({ page }) => {
    const roleInput = page.getByLabel('New Role Name')
    await roleInput.fill('DEVOPS')
    await page.locator('button:has-text("Add Role")').click()
    await page.waitForTimeout(500)

    // The new role chip should appear
    await expect(page.locator('.v-chip:has-text("DEVOPS")').first()).toBeVisible()
  })

  test('should display quarters table', async ({ page }) => {
    // Quarter table should have at least one row
    const rows = page.locator('table tbody tr')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should have theme toggle buttons', async ({ page }) => {
    await expect(page.locator('button:has-text("Light")')).toBeVisible()
    await expect(page.locator('button:has-text("Dark")')).toBeVisible()
    await expect(page.locator('button:has-text("System")')).toBeVisible()
  })

  test('should show clear all data confirmation dialog', async ({ page }) => {
    await page.locator('button:has-text("Clear All Data")').click()
    await page.waitForTimeout(300)

    const dialog = page.locator('.v-overlay--active .v-card')
    await expect(dialog.last().getByText('Clear All Data?')).toBeVisible()
    await expect(dialog.last().locator('button:has-text("Cancel")')).toBeVisible()
    await expect(dialog.last().locator('button:has-text("Clear All")')).toBeVisible()

    // Close without clearing
    await dialog.last().locator('button:has-text("Cancel")').click()
  })

  test('should show reset with sample data dialog', async ({ page }) => {
    await page.locator('button:has-text("Reset with Sample Data")').click()
    await page.waitForTimeout(300)

    const dialog = page.locator('.v-overlay--active .v-card')
    await expect(dialog.last().getByText('Reset with Sample Data?')).toBeVisible()
    await expect(dialog.last().locator('button:has-text("Reset with Samples")')).toBeVisible()

    // Close without resetting
    await dialog.last().locator('button:has-text("Cancel")').click()
  })

  test('should have export and import buttons', async ({ page }) => {
    await expect(page.locator('button:has-text("Export Data")')).toBeVisible()
    await expect(page.locator('button:has-text("Import Data")')).toBeVisible()
  })
})

test.describe('Settings - Navigation', () => {
  test('should navigate to settings from drawer', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Click settings in the nav drawer
    await page.locator('.v-navigation-drawer .v-list-item:has-text("Settings")').click()
    await page.waitForTimeout(500)

    await expect(page).toHaveURL(/\/settings/)
    await expect(page.locator('h1')).toContainText('Settings')
  })

  test('should navigate to settings from header gear icon', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Click gear icon in header
    await page.locator('.v-app-bar a[href="/settings"], .v-app-bar .v-btn[title="Settings"]').click()
    await page.waitForTimeout(500)

    await expect(page).toHaveURL(/\/settings/)
  })
})
