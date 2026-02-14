import { test, expect } from '@playwright/test'

test.describe('Members Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/members')
  })

  test('should display members page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Team Members')
  })

  test('should show empty state when no members', async ({ page }) => {
    // Clear localStorage first
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    await expect(page.getByText('No team members yet')).toBeVisible()
  })

  test('should open add member dialog', async ({ page }) => {
    await page.click('text=Add Member')
    await expect(page.locator('.v-dialog')).toBeVisible()
    await expect(page.locator('.v-card-title')).toContainText('Add Team Member')
  })

  test('should add a new member', async ({ page }) => {
    // Clear existing data
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Click add button
    await page.click('text=Add Member')

    // Fill form
    await page.fill('input[label="Name"]', 'John Doe')
    await page.click('.v-select[label="Roles"]')
    await page.click('text=BE')
    await page.click('text=FE')
    await page.press('.v-select[label="Roles"]', 'Escape')
    await page.fill('input[label="Availability"]', '10')

    // Save
    await page.click('text=Save')

    // Verify member was added
    await expect(page.locator('text=John Doe')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.click('text=Add Member')
    await page.click('text=Save')

    // Should show validation error
    await expect(page.locator('.v-messages__message')).toBeVisible()
  })

  test('should edit existing member', async ({ page }) => {
    // Add a member first
    await page.evaluate(() => {
      localStorage.setItem('capest-members', JSON.stringify([{
        id: 'test-member-1',
        name: 'Test User',
        roles: ['BE'],
        availability: 10,
        assignedInitiatives: []
      }]))
    })
    await page.reload()

    // Click edit button
    await page.click('[data-testid="edit-member"]')

    // Modify name
    await page.fill('input[label="Name"]', 'Updated Name')
    await page.click('text=Save')

    // Verify update
    await expect(page.locator('text=Updated Name')).toBeVisible()
  })

  test('should delete member with confirmation', async ({ page }) => {
    // Add a member first
    await page.evaluate(() => {
      localStorage.setItem('capest-members', JSON.stringify([{
        id: 'test-member-1',
        name: 'To Delete',
        roles: ['BE'],
        availability: 10,
        assignedInitiatives: []
      }]))
    })
    await page.reload()

    // Click delete button
    await page.click('[data-testid="delete-member"]')

    // Confirm deletion
    await page.click('.v-dialog >> text=Delete')

    // Verify member is gone
    await expect(page.locator('text=To Delete')).not.toBeVisible()
  })
})

test.describe('Member Card', () => {
  test('should display member information correctly', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('capest-members', JSON.stringify([{
        id: 'test-member-1',
        name: 'Jane Smith',
        roles: ['BE', 'FE'],
        availability: 13,
        assignedInitiatives: ['init-1', 'init-2']
      }]))
    })

    await page.goto('/members')

    await expect(page.locator('text=Jane Smith')).toBeVisible()
    await expect(page.locator('text=BE')).toBeVisible()
    await expect(page.locator('text=FE')).toBeVisible()
  })
})
