import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getCurrentQuarter,
  getCurrentYear,
  getCurrentQuarterId,
  getQuarterDateRange,
  getWeeksInQuarter,
  parseQuarterId,
  getNextQuarterId,
  formatQuarterLabel,
} from '~/utils/dateUtils'

describe('dateUtils', () => {
  describe('getCurrentQuarter', () => {
    it('should return a number between 1 and 4', () => {
      const quarter = getCurrentQuarter()

      expect(quarter).toBeGreaterThanOrEqual(1)
      expect(quarter).toBeLessThanOrEqual(4)
    })
  })

  describe('getCurrentYear', () => {
    it('should return the current year', () => {
      const year = getCurrentYear()

      expect(year).toBe(new Date().getFullYear())
    })
  })

  describe('getCurrentQuarterId', () => {
    it('should return quarter ID in correct format', () => {
      const id = getCurrentQuarterId()

      expect(id).toMatch(/^Q[1-4]-\d{4}$/)
    })
  })

  describe('getQuarterDateRange', () => {
    it('should return correct date range for Q1', () => {
      const { startDate, endDate } = getQuarterDateRange(2025, 1)

      expect(startDate.getMonth()).toBe(0) // January
      expect(startDate.getDate()).toBe(1)
      expect(endDate.getMonth()).toBe(2) // March
    })

    it('should return correct date range for Q4', () => {
      const { startDate, endDate } = getQuarterDateRange(2025, 4)

      expect(startDate.getMonth()).toBe(9) // October
      expect(endDate.getMonth()).toBe(11) // December
      expect(endDate.getDate()).toBe(31)
    })
  })

  describe('getWeeksInQuarter', () => {
    it('should return at least 13 weeks', () => {
      const weeks = getWeeksInQuarter(2025, 1)

      expect(weeks).toBeGreaterThanOrEqual(13)
    })
  })

  describe('parseQuarterId', () => {
    it('should parse valid quarter ID', () => {
      const result = parseQuarterId('Q2-2025')

      expect(result).toEqual({ quarter: 2, year: 2025 })
    })

    it('should return null for invalid format', () => {
      expect(parseQuarterId('invalid')).toBeNull()
      expect(parseQuarterId('Q5-2025')).toBeNull()
      expect(parseQuarterId('Q1-25')).toBeNull()
    })
  })

  describe('getNextQuarterId', () => {
    it('should return next quarter in same year', () => {
      expect(getNextQuarterId('Q1-2025')).toBe('Q2-2025')
      expect(getNextQuarterId('Q2-2025')).toBe('Q3-2025')
      expect(getNextQuarterId('Q3-2025')).toBe('Q4-2025')
    })

    it('should wrap to next year after Q4', () => {
      expect(getNextQuarterId('Q4-2025')).toBe('Q1-2026')
    })

    it('should return input for invalid format', () => {
      expect(getNextQuarterId('invalid')).toBe('invalid')
    })
  })

  describe('formatQuarterLabel', () => {
    it('should format quarter ID for display', () => {
      expect(formatQuarterLabel('Q1-2025')).toBe('2025 Q1')
      expect(formatQuarterLabel('Q4-2024')).toBe('2024 Q4')
    })

    it('should return input for invalid format', () => {
      expect(formatQuarterLabel('invalid')).toBe('invalid')
    })
  })
})
