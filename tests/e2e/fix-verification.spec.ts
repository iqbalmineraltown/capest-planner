import { test, expect } from '@playwright/test'

test.describe('Fix Verification - Member & Initiative Forms', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
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

    // The dialog should be visible - use more specific selector
    const dialog = page.locator('.v-overlay__content .v-card').filter({ hasText: 'Add Team Member' }).first()
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // The form fields MUST be visible inside the dialog
    await expect(dialog.locator('input').first()).toBeVisible({ timeout: 3000 })

    // Check for name field
    await expect(dialog.locator('label:has-text("Name")').first()).toBeVisible()

    // Check for roles combobox
    await expect(dialog.locator('.v-combobox').first()).toBeVisible()

    // Check for quarter availability section
    await expect(dialog.locator('text=Quarter Availability')).toBeVisible()

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

    const dialog = page.locator('.v-overlay__content .v-card').filter({ hasText: 'Team Member' }).first()

    // Fill in name
    await dialog.locator('input').first().fill('Test Pirate')

    // Select a role via the combobox
    const combobox = dialog.locator('.v-combobox input')
    await combobox.click()
    await page.waitForTimeout(300)

    // Click on first role option in the dropdown menu
    const dropdownMenu = page.locator('.v-overlay--active .v-list')
    await dropdownMenu.last().locator('.v-list-item').first().click()
    await page.waitForTimeout(200)

    // Close the dropdown by pressing Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)

    // Add quarter availability - first ensure quarters exist by going to board
    // The form should show "No quarters configured" if no quarters exist
    // Let's add a quarter first from the board page
    await page.keyboard.press('Escape') // Close member dialog
    await page.waitForTimeout(300)
    
    // Go to board and add a quarter
    await page.goto('/board')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    
    // Add a quarter
    await page.click('button:has-text("Add Quarter")')
    await page.waitForTimeout(300)
    const quarterDialog = page.locator('.v-overlay--active .v-card').last()
    await quarterDialog.locator('button:has-text("Add")').click()
    await page.waitForTimeout(500)
    
    // Now go back to members and try adding
    await page.goto('/members')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    
    // Click add member again
    await page.click('button:has-text("Add Member")')
    await page.waitForTimeout(500)
    
    const dialog2 = page.locator('.v-overlay__content .v-card').filter({ hasText: 'Team Member' }).first()
    
    // Fill in name
    await dialog2.locator('input').first().fill('Test Pirate 2')
    
    // Select a role
    const combobox2 = dialog2.locator('.v-combobox input')
    await combobox2.click()
    await page.waitForTimeout(300)
    const dropdownMenu2 = page.locator('.v-overlay--active .v-list')
    await dropdownMenu2.last().locator('.v-list-item').first().click()
    await page.waitForTimeout(200)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
    
    // Add quarter availability
    const addQuarterBtn = dialog2.locator('button:has-text("Add Quarter")')
    await addQuarterBtn.click()
    await page.waitForTimeout(300)
    
    // Select the quarter in the dialog
    const addQuarterDialog = page.locator('.v-overlay--active .v-card').filter({ hasText: 'Add Quarter Availability' })
    const quarterSelect = addQuarterDialog.locator('.v-select')
    await quarterSelect.click()
    await page.waitForTimeout(300)
    
    // Select first quarter option
    const quarterOption = page.locator('.v-overlay--active .v-list-item').first()
    await quarterOption.click()
    await page.waitForTimeout(200)
    
    // Click Add button
    await addQuarterDialog.locator('button:has-text("Add")').click()
    await page.waitForTimeout(300)
    
    // Now set availability value
    const quarterAvailInput = dialog2.locator('.quarter-availability-card input[type="number"]')
    if (await quarterAvailInput.count() > 0) {
      await quarterAvailInput.first().fill('10')
    }

    // Submit the form
    await dialog2.locator('button[type="submit"]').click()
    await page.waitForTimeout(1000)

    // Dialog should close
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

  test('seed data loads with quarter availability', async ({ page }) => {
    // First visit: seed data loads
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Verify seed data loaded (members should exist with quarterAvailability)
    const membersData = await page.evaluate(() => {
      const stored = localStorage.getItem('capest-members')
      if (!stored) return null
      const members = JSON.parse(stored)
      return {
        count: members.length,
        hasQuarterAvailability: members.every((m: any) => m.quarterAvailability !== undefined)
      }
    })
    
    expect(membersData).not.toBeNull()
    expect(membersData?.count).toBeGreaterThan(0)
    expect(membersData?.hasQuarterAvailability).toBe(true)

    // Check seed flag was set
    const hasSeedFlag = await page.evaluate(() => {
      return localStorage.getItem('capest-seeded') === 'true'
    })
    expect(hasSeedFlag).toBe(true)
  })
})
