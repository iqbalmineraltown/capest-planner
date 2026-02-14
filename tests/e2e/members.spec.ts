import { test, expect } from '@playwright/test'

test.describe('Members Page', () => {
  test('should display members page', async ({ page }) => {
    await page.goto('/members')
    await expect(page.locator('h1')).toContainText('Team Members')
  })

  test('should open add member dialog', async ({ page }) => {
    await page.goto('/members')
    await page.click('button:has-text("Add Member")')
    await expect(page.getByText('Add Team Member')).toBeVisible()
  })

  test('should display member card with information', async ({ page }) => {
    // First navigate to establish context
    await page.goto('/members')

    // Then set localStorage
    await page.evaluate(() => {
      localStorage.setItem('capest-quarters', JSON.stringify([{
        id: 'Q1-2025',
        label: '2025 Q1',
        totalWeeks: 13,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-03-31T00:00:00.000Z'
      }]))
      localStorage.setItem('capest-members', JSON.stringify([{
        id: 'test-member-1',
        name: 'Shirohige',
        roles: ['BE', 'FE'],
        availability: 13,
        assignedInitiatives: []
      }]))
    })

    // Reload to apply localStorage
    await page.reload()
    await expect(page.locator('text=Shirohige')).toBeVisible({ timeout: 10000 })
  })

  test('should have edit and delete buttons on member cards', async ({ page }) => {
    await page.goto('/members')

    await page.evaluate(() => {
      localStorage.setItem('capest-quarters', JSON.stringify([{
        id: 'Q1-2025',
        label: '2025 Q1',
        totalWeeks: 13,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-03-31T00:00:00.000Z'
      }]))
      localStorage.setItem('capest-members', JSON.stringify([{
        id: 'test-member-1',
        name: 'Kaido',
        roles: ['BE'],
        availability: 10,
        assignedInitiatives: []
      }]))
    })

    await page.reload()

    // Check that the member card has action buttons
    await expect(page.locator('[data-testid="edit-member-btn"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="delete-member-btn"]')).toBeVisible()
  })
})
