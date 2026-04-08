import { test, expect } from '@playwright/test'

test.describe('Board Drag & Drop', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and localStorage to ensure fresh data
    await page.context().clearCookies()
    await page.goto('/board')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  })

  test('should display assignment cards in week columns', async ({ page }) => {
    // Verify seed data loaded — at least one swimlane visible
    const swimlanes = page.locator('.board-swimlane')
    await expect(swimlanes.first()).toBeVisible({ timeout: 10000 })
    const count = await swimlanes.count()
    expect(count).toBeGreaterThan(0)

    // Verify assignment cards exist
    const cards = page.locator('.assignment-card')
    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThan(0)
  })

  test('should show member sidebar with draggable cards', async ({ page }) => {
    const sidebar = page.locator('.member-sidebar')
    await expect(sidebar).toBeVisible({ timeout: 10000 })

    const memberCards = page.locator('.member-pool-card')
    const count = await memberCards.count()
    expect(count).toBeGreaterThan(0)

    // Verify draggable attribute
    const draggable = await memberCards.first().getAttribute('draggable')
    expect(draggable).toBe('true')
  })

  test('should be able to drag a member card to a week column', async ({ page }) => {
    // Wait for board to render
    await page.waitForSelector('.member-pool-card', { timeout: 10000 })
    await page.waitForSelector('.week-column', { timeout: 10000 })

    // Get the first swimlane's first week column
    const swimlane = page.locator('.board-swimlane').first()
    const weekColumns = swimlane.locator('.week-column')

    // Find a week column that is initially empty (no assignment cards)
    let targetWeekIdx = -1
    const weekCount = await weekColumns.count()
    for (let i = 0; i < weekCount; i++) {
      const cardsInWeek = await weekColumns.nth(i).locator('.assignment-card').count()
      if (cardsInWeek === 0) {
        targetWeekIdx = i
        break
      }
    }

    // If no empty column found, just pick the last one
    if (targetWeekIdx === -1) targetWeekIdx = weekCount - 1

    const targetColumn = weekColumns.nth(targetWeekIdx)

    // Drag member card to target week column
    const memberCard = page.locator('.member-pool-card').first()
    await memberCard.dragTo(targetColumn)
    await page.waitForTimeout(1000)

    // Verify card was added
    const cardsAfterDrag = targetColumn.locator('.assignment-card')
    expect(await cardsAfterDrag.count()).toBeGreaterThan(0)
  })

  test('should be able to drag an assignment card to a different week column', async ({ page }) => {
    await page.waitForSelector('.board-swimlane', { timeout: 10000 })
    const swimlane = page.locator('.board-swimlane').first()
    const weekColumns = swimlane.locator('.week-column')
    await weekColumns.first().waitFor()
    const sourceColumn = weekColumns.first()
    const targetColumn = weekColumns.last()

    // Check there's an assignment card in source column
    const sourceCards = sourceColumn.locator('.assignment-card')
    await sourceCards.first().waitFor()
    const card = sourceCards.first()

    // Drag card to target column
    await card.dragTo(targetColumn)
    await page.waitForTimeout(1000)

    // Verify card moved
    const targetCards = targetColumn.locator('.assignment-card')
    expect(await targetCards.count()).toBeGreaterThan(0)
  })

  test('week columns should show drop indicator during drag', async ({ page }) => {
    await page.waitForSelector('.assignment-card', { timeout: 10000 })
    await page.waitForSelector('.week-column', { timeout: 10000 })

    // Dispatch dragstart + dragenter via evaluate, then wait for Vue to flush
    await page.evaluate(() => {
      const source = document.querySelector('.member-pool-card')
      const target = document.querySelector('.board-swimlane:first-child .week-column:nth-child(8)')
      if (!source || !target) throw new Error('Could not find source or target')

      const dt = new DataTransfer()

      source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }))
      target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }))
      target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }))
    })

    // Wait for Vue to flush reactive updates to the DOM
    await page.waitForTimeout(200)

    const weekCol = page.locator('.board-swimlane:first-child .week-column:nth-child(8)')
    const hasIndicator = await weekCol.evaluate(el => el.classList.contains('week-column--drop-target'))

    expect(hasIndicator).toBe(true)
  })
})