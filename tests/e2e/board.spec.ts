import { test, expect } from '@playwright/test'

test.describe('Capacity Board Page', () => {
  test('should display board page', async ({ page }) => {
    await page.goto('/board')
    await expect(page.locator('h1')).toContainText('Capacity Board')
  })

  test('should display board with initiatives and assignments', async ({ page }) => {
    await page.goto('/board')

    await page.evaluate(() => {
      localStorage.setItem('capest-quarters', JSON.stringify([{
        id: 'Q1-2025',
        label: '2025 Q1',
        totalWeeks: 13,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-03-31T00:00:00.000Z'
      }]))
      localStorage.setItem('capest-members', JSON.stringify([
        { id: 'member-1', name: 'Shanks', roles: ['BE', 'FE'], availability: 13, assignedInitiatives: ['init-1'] },
        { id: 'member-2', name: 'Mihawk', roles: ['QA'], availability: 10, assignedInitiatives: [] }
      ]))
      localStorage.setItem('capest-initiatives', JSON.stringify([
        {
          id: 'init-1',
          name: 'East Blue Conquest',
          description: 'Take over the East Blue seas',
          quarter: 'Q1-2025',
          roleRequirements: [
            { role: 'BE', effort: 8 },
            { role: 'QA', effort: 4 }
          ],
          assignments: [
            { memberId: 'member-1', role: 'BE', weeksAllocated: 8, startWeek: 1, isParallel: false }
          ]
        }
      ]))
    })

    await page.reload()

    // Should show quarter label
    await expect(page.locator('text=2025 Q1')).toBeVisible({ timeout: 10000 })

    // Should show initiative
    await expect(page.locator('text=East Blue Conquest')).toBeVisible()

    // Should show assignment (member name in assignment cell)
    await expect(page.locator('text=Shanks')).toBeVisible()
  })
})
