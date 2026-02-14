import { test, expect } from '@playwright/test'

test.describe('Initiatives Page', () => {
  test('should display initiatives page', async ({ page }) => {
    await page.goto('/initiatives')
    await expect(page.locator('h1')).toContainText('Initiatives')
  })

  test('should open add initiative dialog', async ({ page }) => {
    await page.goto('/initiatives')
    await page.click('button:has-text("Add Initiative")')
    await expect(page.getByText('Add Initiative')).toBeVisible()
  })

  test('should display initiative card with information', async ({ page }) => {
    await page.goto('/initiatives')

    await page.evaluate(() => {
      localStorage.setItem('capest-quarters', JSON.stringify([{
        id: 'Q1-2025',
        label: '2025 Q1',
        totalWeeks: 13,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-03-31T00:00:00.000Z'
      }]))
      localStorage.setItem('capest-initiatives', JSON.stringify([{
        id: 'test-init',
        name: 'Wano Liberation',
        description: 'Free Wano from Kaido',
        quarter: 'Q1-2025',
        roleRequirements: [{ role: 'BE', effort: 8 }],
        assignments: []
      }]))
    })

    await page.reload()
    await expect(page.locator('text=Wano Liberation')).toBeVisible({ timeout: 10000 })
  })
})
