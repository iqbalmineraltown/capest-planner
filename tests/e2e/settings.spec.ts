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
    await expect(page.locator('.v-chip:has-text("BE")').first()).toBeVisible()
    await expect(page.locator('.v-chip:has-text("FE")').first()).toBeVisible()
    await expect(page.locator('.v-chip:has-text("MOBILE")').first()).toBeVisible()
    await expect(page.locator('.v-chip:has-text("QA")').first()).toBeVisible()
  })

  test('should add a custom role with auto-assigned color', async ({ page }) => {
    const roleInput = page.getByLabel('New Role Name')
    await roleInput.fill('DEVOPS')
    await page.locator('button:has-text("Add Role")').click()
    await page.waitForTimeout(500)

    // The new role chip should appear
    const chip = page.locator('.v-chip:has-text("DEVOPS")').first()
    await expect(chip).toBeVisible()
  })

  test('should show confirmation dialog before removing a custom role', async ({ page }) => {
    // First add a custom role
    const roleInput = page.getByLabel('New Role Name')
    await roleInput.fill('DEVOPS')
    await page.locator('button:has-text("Add Role")').click()
    await page.waitForTimeout(500)

    const chip = page.locator('.v-chip:has-text("DEVOPS")').first()
    await expect(chip).toBeVisible()

    // Click close (remove) on the chip
    await chip.locator('.role-close-btn').click()
    await page.waitForTimeout(300)

    // A confirmation dialog should appear
    const dialog = page.locator('.v-overlay--active .v-card')
    await expect(dialog.last().getByText('Remove Role?')).toBeVisible()
    await expect(dialog.last().locator('button:has-text("Cancel")')).toBeVisible()
    await expect(dialog.last().locator('button:has-text("Remove")')).toBeVisible()

    // Cancel — role should still exist
    await dialog.last().locator('button:has-text("Cancel")').click()
    await page.waitForTimeout(300)
    await expect(page.locator('.v-chip:has-text("DEVOPS")').first()).toBeVisible()
  })

  test('should remove custom role after confirmation', async ({ page }) => {
    // Add a custom role
    const roleInput = page.getByLabel('New Role Name')
    await roleInput.fill('DEVOPS')
    await page.locator('button:has-text("Add Role")').click()
    await page.waitForTimeout(500)

    // Click remove
    const chip = page.locator('.v-chip:has-text("DEVOPS")').first()
    await chip.locator('.role-close-btn').click()
    await page.waitForTimeout(300)

    // Confirm removal
    const dialog = page.locator('.v-overlay--active .v-card')
    await dialog.last().locator('button:has-text("Remove")').click()
    await page.waitForTimeout(500)

    // Role should be gone
    await expect(page.locator('.v-chip:has-text("DEVOPS")')).toHaveCount(0)
  })

  test('should open edit dialog when clicking a role chip', async ({ page }) => {
    // Click on the BE chip
    await page.locator('.v-chip:has-text("BE")').first().click()
    await page.waitForTimeout(300)

    // Edit dialog should open
    const dialog = page.locator('.v-overlay--active .v-card')
    await expect(dialog.last().getByText('Edit Role')).toBeVisible()

    // Should show color swatches
    await expect(dialog.last().locator('.color-swatch').first()).toBeVisible()

    // Default role should show name as non-editable
    await expect(dialog.last().getByText('default role')).toBeVisible()

    // Close dialog
    await dialog.last().locator('button:has-text("Cancel")').click()
  })

  test('should not have close button on default role chips', async ({ page }) => {
    const beChip = page.locator('.v-chip:has-text("BE")').first()
    await expect(beChip.locator('.role-close-btn')).toHaveCount(0)
  })

  test('should display quarters table', async ({ page }) => {
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

    await dialog.last().locator('button:has-text("Cancel")').click()
  })

  test('should show reset with sample data dialog', async ({ page }) => {
    await page.locator('button:has-text("Reset with Sample Data")').click()
    await page.waitForTimeout(300)

    const dialog = page.locator('.v-overlay--active .v-card')
    await expect(dialog.last().getByText('Reset with Sample Data?')).toBeVisible()
    await expect(dialog.last().locator('button:has-text("Reset with Samples")')).toBeVisible()

    await dialog.last().locator('button:has-text("Cancel")').click()
  })

  test('should have export and import buttons', async ({ page }) => {
    await expect(page.locator('button:has-text("Export Data")')).toBeVisible()
    await expect(page.locator('button:has-text("Import Data")')).toBeVisible()
  })

  test('should display data management storage stats', async ({ page }) => {
    const alert = page.locator('.v-alert')
    await expect(alert.first()).toBeVisible()
    await expect(alert.first()).toContainText('members')
    await expect(alert.first()).toContainText('initiatives')
    await expect(alert.first()).toContainText('quarters')
    await expect(alert.first()).toContainText('roles')
  })

  test('should display app version in about section', async ({ page }) => {
    await expect(page.getByText(/v\d+\.\d+\.\d+/)).toBeVisible()
    // Scope to main content area to avoid matching the toolbar title
    await expect(page.locator('.settings-page').getByText('Capest Planner')).toBeVisible()
  })
})

test.describe('Settings - Navigation', () => {
  test('should navigate to settings from drawer bottom button', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Click the Settings button at the bottom of the sidebar
    const settingsBtn = page.locator('.v-navigation-drawer').locator('button:has-text("Settings"), a:has-text("Settings")').last()
    await settingsBtn.click()
    await page.waitForTimeout(500)

    await expect(page).toHaveURL(/\/settings/)
    await expect(page.locator('h1')).toContainText('Settings')
  })

  test('should not have settings link in top nav list', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Top nav list should have exactly 4 items (no Settings)
    const navItems = page.locator('.v-navigation-drawer .v-list').first().locator('.v-list-item')
    const count = await navItems.count()
    expect(count).toBe(4)
  })

  test('should not have actions in the app bar', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    // Only the hamburger nav icon should be in the app bar
    const appBarButtons = page.locator('.v-app-bar .v-btn')
    const count = await appBarButtons.count()
    expect(count).toBeLessThanOrEqual(1)
  })

  test('should not have Quick Stats section in sidebar', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)

    await expect(page.locator('.v-navigation-drawer')).not.toContainText('Quick Stats')
  })
})
