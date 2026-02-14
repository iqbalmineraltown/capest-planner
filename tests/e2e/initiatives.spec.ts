import { test, expect } from '@playwright/test'

test.describe('Initiatives Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/initiatives')
  })

  test('should display initiatives page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Initiatives')
  })

  test('should show empty state when no initiatives', async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    await expect(page.getByText('No initiatives')).toBeVisible()
  })

  test('should open add initiative dialog', async ({ page }) => {
    await page.click('text=Add Initiative')
    await expect(page.locator('.v-dialog')).toBeVisible()
  })

  test('should create new initiative', async ({ page }) => {
    // Setup quarter
    await page.evaluate(() => {
      localStorage.setItem('capest-quarters', JSON.stringify([{
        id: 'Q1-2025',
        label: '2025 Q1',
        totalWeeks: 13,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-03-31T00:00:00.000Z'
      }]))
    })
    await page.reload()

    await page.click('text=Add Initiative')

    // Fill form
    await page.fill('input[label="Name"]', 'New Feature')
    await page.fill('textarea[label="Description"]', 'Build new feature for users')

    // Select quarter
    await page.click('.v-select[label="Quarter"]')
    await page.click('text=Q1-2025')

    // Add role requirement
    await page.click('text=Add Role Requirement')
    await page.click('[data-testid="role-select"]')
    await page.click('text=BE')
    await page.fill('[data-testid="effort-input"]', '5')

    // Save
    await page.click('text=Save')

    // Verify
    await expect(page.locator('text=New Feature')).toBeVisible()
  })

  test('should filter initiatives by quarter', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('capest-quarters', JSON.stringify([
        { id: 'Q1-2025', label: '2025 Q1', totalWeeks: 13, startDate: '2025-01-01T00:00:00.000Z', endDate: '2025-03-31T00:00:00.000Z' },
        { id: 'Q2-2025', label: '2025 Q2', totalWeeks: 13, startDate: '2025-04-01T00:00:00.000Z', endDate: '2025-06-30T00:00:00.000Z' }
      ]))
      localStorage.setItem('capest-initiatives', JSON.stringify([
        { id: '1', name: 'Q1 Initiative', description: '', quarter: 'Q1-2025', roleRequirements: [], assignments: [] },
        { id: '2', name: 'Q2 Initiative', description: '', quarter: 'Q2-2025', roleRequirements: [], assignments: [] }
      ]))
    })
    await page.reload()

    // Filter by Q1
    await page.click('.v-select[label="Filter by Quarter"]')
    await page.click('text=Q1-2025')

    await expect(page.locator('text=Q1 Initiative')).toBeVisible()
    await expect(page.locator('text=Q2 Initiative')).not.toBeVisible()
  })

  test('should delete initiative', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('capest-initiatives', JSON.stringify([{
        id: 'test-init',
        name: 'To Delete',
        description: '',
        quarter: 'Q1-2025',
        roleRequirements: [],
        assignments: []
      }]))
    })
    await page.reload()

    await page.click('[data-testid="delete-initiative"]')
    await page.click('.v-dialog >> text=Delete')

    await expect(page.locator('text=To Delete')).not.toBeVisible()
  })
})
