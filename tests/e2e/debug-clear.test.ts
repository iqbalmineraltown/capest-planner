import { test, expect } from '@playwright/test'

test('Clear localStorage and check board', async ({ page }) => {
  // Clear localStorage
  await page.evaluate(() => {
    localStorage.clear()
  })
  
  // Reload page
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/board-after-clear.png', fullPage: true })
  
  // Count swimlanes
  const swimlanes = page.locator('.board-swimlane')
  console.log('Swimlanes count after clear:', await swimlanes.count())
})
