import { test, expect } from '@playwright/test'

test.describe('Capacity Board Page', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data
    await page.evaluate(() => {
      localStorage.setItem('capest-quarters', JSON.stringify([{
        id: 'Q1-2025',
        label: '2025 Q1',
        totalWeeks: 13,
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-03-31T00:00:00.000Z'
      }]))
      localStorage.setItem('capest-members', JSON.stringify([
        { id: 'member-1', name: 'John Doe', roles: ['BE', 'FE'], availability: 13, assignedInitiatives: [] },
        { id: 'member-2', name: 'Jane Smith', roles: ['QA'], availability: 10, assignedInitiatives: [] }
      ]))
      localStorage.setItem('capest-initiatives', JSON.stringify([
        {
          id: 'init-1',
          name: 'Feature Alpha',
          description: 'Build feature alpha',
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

    await page.goto('/board')
  })

  test('should display board page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Capacity Board')
  })

  test('should show quarter summary', async ({ page }) => {
    await expect(page.locator('.quarter-summary')).toBeVisible()
    await expect(page.locator('text=Available')).toBeVisible()
    await expect(page.locator('text=Allocated')).toBeVisible()
  })

  test('should display initiative rows', async ({ page }) => {
    await expect(page.locator('text=Feature Alpha')).toBeVisible()
    await expect(page.locator('text=BE: 8w')).toBeVisible()
    await expect(page.locator('text=QA: 4w')).toBeVisible()
  })

  test('should show assignment cells in correct weeks', async ({ page }) => {
    // Assignment should appear in weeks 1-8
    const week1Cell = page.locator('.week-cell').first()
    await expect(week1Cell.locator('text=John Doe')).toBeVisible()
  })

  test('should open assignment dialog on click', async ({ page }) => {
    await page.click('.assignment-cell')
    await expect(page.locator('.v-dialog')).toBeVisible()
    await expect(page.locator('text=Edit Assignment')).toBeVisible()
  })

  test('should add new assignment', async ({ page }) => {
    // Click add button on initiative row
    await page.click('[data-testid="add-assignment"]')

    // Fill form
    await page.click('.v-select[label="Team Member"]')
    await page.click('text=Jane Smith')
    await page.click('.v-select[label="Role"]')
    await page.click('text=QA')
    await page.fill('input[label="Weeks Allocated"]', '4')
    await page.fill('input[label="Start Week"]', '1')

    await page.click('text=Add')

    // Verify assignment appears
    await expect(page.locator('.assignment-cell:has-text("Jane Smith")')).toBeVisible()
  })

  test('should show utilization percentage', async ({ page }) => {
    await expect(page.locator('text=Utilization')).toBeVisible()
  })

  test('should show over-allocation warning', async ({ page }) => {
    // Setup over-allocated scenario
    await page.evaluate(() => {
      localStorage.setItem('capest-initiatives', JSON.stringify([
        {
          id: 'init-1',
          name: 'Big Project',
          description: '',
          quarter: 'Q1-2025',
          roleRequirements: [],
          assignments: [
            { memberId: 'member-2', role: 'QA', weeksAllocated: 15, startWeek: 1, isParallel: false }
          ]
        }
      ]))
    })
    await page.reload()

    await expect(page.locator('.v-alert:has-text("over-allocated")')).toBeVisible()
  })

  test('should allow switching quarters', async ({ page }) => {
    // Add another quarter
    await page.evaluate(() => {
      localStorage.setItem('capest-quarters', JSON.stringify([
        { id: 'Q1-2025', label: '2025 Q1', totalWeeks: 13, startDate: '2025-01-01T00:00:00.000Z', endDate: '2025-03-31T00:00:00.000Z' },
        { id: 'Q2-2025', label: '2025 Q2', totalWeeks: 13, startDate: '2025-04-01T00:00:00.000Z', endDate: '2025-06-30T00:00:00.000Z' }
      ]))
    })
    await page.reload()

    await page.click('.v-select[label="Quarter"]')
    await page.click('text=2025 Q2')

    // Should show empty board for Q2
    await expect(page.locator('text=No Initiatives')).toBeVisible()
  })

  test('should add new quarter', async ({ page }) => {
    await page.click('text=Add Quarter')

    // Select year and quarter
    await page.click('.v-select[label="Year"]')
    await page.click('text=2026')
    await page.click('.v-select[label="Quarter"]')
    await page.click('text=2')

    await page.click('.v-dialog >> text=Add')

    // Should switch to new quarter
    await expect(page.locator('text=2026 Q2')).toBeVisible()
  })
})

test.describe('Board Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('capest-quarters', JSON.stringify([{
        id: 'Q1-2025', label: '2025 Q1', totalWeeks: 13,
        startDate: '2025-01-01T00:00:00.000Z', endDate: '2025-03-31T00:00:00.000Z'
      }]))
      localStorage.setItem('capest-members', JSON.stringify([
        { id: 'member-1', name: 'John', roles: ['BE'], availability: 13, assignedInitiatives: ['init-1'] }
      ]))
      localStorage.setItem('capest-initiatives', JSON.stringify([{
        id: 'init-1', name: 'Test Initiative', description: '', quarter: 'Q1-2025',
        roleRequirements: [{ role: 'BE', effort: 8 }],
        assignments: [{ memberId: 'member-1', role: 'BE', weeksAllocated: 4, startWeek: 1, isParallel: false }]
      }]))
    })
    await page.goto('/board')
  })

  test('should make assignment cells draggable', async ({ page }) => {
    const assignmentCell = page.locator('.assignment-cell')
    await expect(assignmentCell).toHaveAttribute('draggable', 'true')
  })
})
