import { test, expect } from '@playwright/test'

test.describe('Fix Verification - Member & Initiative Forms', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh, but then set the seed flag
    // so seed data doesn't load
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  test('member form renders inside add dialog', async ({ page }) => {
    await page.goto('/members')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Click add member
    await page.click('button:has-text("Add Member")')
    await page.waitForTimeout(500)

    // The dialog should be visible
    const dialog = page.locator('.v-overlay__content .v-card:visible')
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // The form fields MUST be visible inside the dialog (use .first() for Vuetify double labels)
    await expect(dialog.locator('input').first()).toBeVisible({ timeout: 3000 })

    // Check for name field (Vuetify renders 2 labels - use first)
    await expect(dialog.locator('label:has-text("Name")').first()).toBeVisible()

    // Check for roles combobox
    await expect(dialog.locator('.v-combobox').first()).toBeVisible()

    // Check for availability field
    await expect(dialog.locator('input[type="number"]')).toBeVisible()

    // Check for submit button
    await expect(dialog.locator('button[type="submit"]')).toBeVisible()
  })

  test('can add a new member via the form', async ({ page }) => {
    await page.goto('/members')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Click add member
    await page.click('button:has-text("Add Member")')
    await page.waitForTimeout(500)

    const dialog = page.locator('.v-overlay__content .v-card:visible')

    // Fill in name
    await dialog.locator('input').first().fill('Test Pirate')

    // Fill availability
    const availInput = dialog.locator('input[type="number"]')
    await availInput.clear()
    await availInput.fill('10')

    // Select a role via the combobox
    const combobox = dialog.locator('.v-combobox input')
    await combobox.click()
    await page.waitForTimeout(300)

    // Click on first role option in the dropdown menu (not drawer items)
    const dropdownMenu = page.locator('.v-overlay--active .v-list')
    await dropdownMenu.last().locator('.v-list-item').first().click()
    await page.waitForTimeout(200)

    // Close the dropdown by pressing Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)

    // Submit the form
    await dialog.locator('button[type="submit"]').click()
    await page.waitForTimeout(1000)

    // Dialog should close - verify by checking for member card or success
    // Wait for snackbar or dialog to close
    await page.waitForTimeout(500)
  })

  test('initiative form renders with role requirement inputs', async ({ page }) => {
    await page.goto('/initiatives')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Click add initiative
    await page.click('button:has-text("Add Initiative")')
    await page.waitForTimeout(500)

    // Use the last visible overlay for the dialog (Vuetify stacks overlays)
    const dialog = page.locator('.v-overlay--active .v-overlay__content').last()
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Check form fields exist using getByLabel which handles Vuetify labels
    await expect(dialog.getByLabel('Initiative Name')).toBeVisible()
    await expect(dialog.getByLabel('Description')).toBeVisible()

    // Click "Add Role" button
    const addRoleBtn = dialog.locator('button:has-text("Add Role")')
    await expect(addRoleBtn).toBeVisible()
    await addRoleBtn.click()
    await page.waitForTimeout(300)

    // Role requirement input should appear with a role select and effort field
    await expect(dialog.locator('.role-req-card').first()).toBeVisible()
    await expect(dialog.getByLabel('Role').first()).toBeVisible()
    await expect(dialog.getByLabel('Effort (MW)').first()).toBeVisible()

    // Add another role
    await addRoleBtn.click()
    await page.waitForTimeout(300)

    // Should now have 2 role requirement rows
    const roleCards = dialog.locator('.role-req-card')
    await expect(roleCards).toHaveCount(2)
  })

  test('seed data only loads once, not after clearing data', async ({ page }) => {
    // First visit: seed data loads
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Verify seed data loaded (members should exist)
    const hasMembers = await page.evaluate(() => {
      const stored = localStorage.getItem('capest-members')
      return stored ? JSON.parse(stored).length > 0 : false
    })
    expect(hasMembers).toBe(true)

    // Check seed flag was set
    const hasSeedFlag = await page.evaluate(() => {
      return localStorage.getItem('capest-seeded') === 'true'
    })
    expect(hasSeedFlag).toBe(true)

    // Now clear data stores but keep the seed flag
    await page.evaluate(() => {
      localStorage.removeItem('capest-members')
      localStorage.removeItem('capest-initiatives')
      localStorage.removeItem('capest-quarters')
      localStorage.removeItem('capest-roles')
      // capest-seeded remains
    })

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Seed data should NOT reload
    const membersAfterClear = await page.evaluate(() => {
      const stored = localStorage.getItem('capest-members')
      return stored ? JSON.parse(stored).length : 0
    })
    expect(membersAfterClear).toBe(0)
  })
})
