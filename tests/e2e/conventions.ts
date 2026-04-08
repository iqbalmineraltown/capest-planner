import { defineGlobalFixture, test as baseTest } from '@playwright/test'

export const globalConventions = defineGlobalFixture({
  async initialize() {
    // This runs once before all tests
    // We'll ensure localStorage is cleared and seed data is reset
  },
})

// Override test function to clear data before each test
export const test = baseTest.extend({
  async beforeEach(testInfo, runTest) {
    // Clear cookies and localStorage to reset seed data
    await testInfo.context.clearCookies()
    
    // Also clear localStorage directly via page.evaluate
    // This is needed because Playwright's clearCookies may not clear localStorage in all cases
    await testInfo.page.evaluate(() => {
      localStorage.clear()
      // Remove the seed flag to force reseeding
      localStorage.removeItem('capest-seeded')
    })
    
    // Reload the page to trigger reseeding
    await testInfo.page.goto('/')
    await testInfo.page.waitForLoadState('networkidle')
    
    return runTest()
  },
})