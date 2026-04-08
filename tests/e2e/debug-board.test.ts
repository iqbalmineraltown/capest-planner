import { test, expect } from '@playwright/test'

test('Debug board page', async ({ page }) => {
  await page.goto('/board')
  await page.waitForTimeout(2000)
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/board-page.png', fullPage: true })
  
  // Log console messages
  page.on('console', msg => console.log('CONSOLE:', msg.text()))
  
  // Check for errors in console
  const consoleMessages = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleMessages.push(msg.text())
    }
  })
  
  // Wait a bit for console messages
  await page.waitForTimeout(1000)
  
  console.log('ERROR MESSAGES:', consoleMessages)
  
  // Count elements
  const swimlanes = page.locator('.board-swimlane')
  console.log('Swimlanes count:', await swimlanes.count())
  
  const weekColumns = page.locator('.week-column')
  console.log('Week columns count:', await weekColumns.count())
  
  const assignmentCards = page.locator('.assignment-card')
  console.log('Assignment cards count:', await assignmentCards.count())
  
  // Check if there are any initiatives
  const initiatives = page.locator('.swimlane-header__title')
  console.log('Initiatives count:', await initiatives.count())
  
  // Check for any console errors
  const errors = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.v-alert--error')).length > 0
  })
  console.log('Error alerts present:', errors)
})
