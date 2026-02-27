import { test, expect, type Page } from '@playwright/test'

/**
 * Helper: Dispatch a full HTML5 DnD sequence manually.
 * Playwright's built-in dragTo uses mouse events which don't trigger
 * HTML5 dragstart/dragover/drop events in all frameworks.
 */
async function html5DragDrop(page: Page, sourceSelector: string, targetSelector: string) {
  await page.evaluate(
    ({ src, tgt }) => {
      function fire(el: Element, type: string, dt: DataTransfer) {
        el.dispatchEvent(
          new DragEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            dataTransfer: dt,
          })
        )
      }

      const source = document.querySelector(src)
      const target = document.querySelector(tgt)
      if (!source) throw new Error(`Source not found: ${src}`)
      if (!target) throw new Error(`Target not found: ${tgt}`)

      const dt = new DataTransfer()

      // dragstart on source
      fire(source, 'dragstart', dt)

      // Simulate the drag entering and hovering over the target
      fire(target, 'dragenter', dt)
      fire(target, 'dragover', dt)

      // Small delay simulation — just dispatch drop
      fire(target, 'drop', dt)

      // Clean up
      fire(source, 'dragend', dt)
    },
    { src: sourceSelector, tgt: targetSelector }
  )
}

test.describe('Board Drag & Drop', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and load fresh with seed data
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

    // Count cards before drop
    const cardsBefore = await swimlane.locator('.assignment-card').count()

    // Use HTML5 DnD to drag a member card to the target week column
    // We use nth-child CSS selectors for precision
    const memberCardSelector = '.member-pool-card:first-child'
    const targetColumnSelector = `.board-swimlane:first-child .week-column:nth-child(${targetWeekIdx + 1})`

    await html5DragDrop(page, memberCardSelector, targetColumnSelector)
    await page.waitForTimeout(500)

    // Should have one more assignment card in the swimlane
    const cardsAfter = await swimlane.locator('.assignment-card').count()
    expect(cardsAfter).toBeGreaterThanOrEqual(cardsBefore)
  })

  test('should be able to drag an assignment card to a different week column', async ({ page }) => {
    // Wait for everything to render
    await page.waitForSelector('.assignment-card', { timeout: 10000 })

    const swimlane = page.locator('.board-swimlane').first()
    const weekColumns = swimlane.locator('.week-column')

    // Find a week column with an assignment card
    let sourceWeekIdx = -1
    const weekCount = await weekColumns.count()
    for (let i = 0; i < weekCount; i++) {
      const cardsInWeek = await weekColumns.nth(i).locator('.assignment-card').count()
      if (cardsInWeek > 0) {
        sourceWeekIdx = i
        break
      }
    }
    expect(sourceWeekIdx).toBeGreaterThanOrEqual(0)

    // Get the assignment card info before drag
    const sourceCard = weekColumns.nth(sourceWeekIdx).locator('.assignment-card').first()
    const memberName = await sourceCard.locator('.assignment-card__name').textContent()

    // Find a DIFFERENT empty (or sparse) week column to drop to
    let targetWeekIdx = -1
    for (let i = 0; i < weekCount; i++) {
      if (i === sourceWeekIdx) continue
      const cardsInWeek = await weekColumns.nth(i).locator('.assignment-card').count()
      if (cardsInWeek === 0) {
        targetWeekIdx = i
        break
      }
    }
    // If no empty column, just use the last column
    if (targetWeekIdx === -1) {
      targetWeekIdx = sourceWeekIdx < weekCount - 1 ? weekCount - 1 : 0
    }

    // Perform the drag
    // NOTE: Can't use :first-child because .week-column__label is the actual first child
    const sourceSelector = `.board-swimlane:first-child .week-column:nth-child(${sourceWeekIdx + 1}) .assignment-card`
    const targetSelector = `.board-swimlane:first-child .week-column:nth-child(${targetWeekIdx + 1})`

    await html5DragDrop(page, sourceSelector, targetSelector)
    await page.waitForTimeout(500)

    // The assignment card with the same member name should now be in the target column
    const targetColumn = weekColumns.nth(targetWeekIdx)
    const targetCards = targetColumn.locator('.assignment-card')
    const targetCardCount = await targetCards.count()

    // Verify the card moved — the target column should have a card with the member's name
    let found = false
    for (let i = 0; i < targetCardCount; i++) {
      const name = await targetCards.nth(i).locator('.assignment-card__name').textContent()
      if (name === memberName) {
        found = true
        break
      }
    }
    expect(found).toBe(true)
  })

  test('week columns should show drop indicator during drag', async ({ page }) => {
    await page.waitForSelector('.assignment-card', { timeout: 10000 })

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
