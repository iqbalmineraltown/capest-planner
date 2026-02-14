import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateId,
  generateMemberId,
  generateInitiativeId,
  generateQuarterId,
} from '~/utils/idGenerator'

describe('idGenerator', () => {
  describe('generateId', () => {
    it('should generate a unique ID', () => {
      const id1 = generateId()
      const id2 = generateId()

      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
    })

    it('should include prefix when provided', () => {
      const id = generateId('test')

      expect(id).toMatch(/^test-/)
    })

    it('should generate IDs with timestamp and random parts', () => {
      const id = generateId()

      // Should have format: timestamp-randompart
      expect(id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/)
    })
  })

  describe('generateMemberId', () => {
    it('should generate member ID with member prefix', () => {
      const id = generateMemberId()

      expect(id).toMatch(/^member-/)
    })

    it('should generate unique member IDs', () => {
      const id1 = generateMemberId()
      const id2 = generateMemberId()

      expect(id1).not.toBe(id2)
    })
  })

  describe('generateInitiativeId', () => {
    it('should generate initiative ID with initiative prefix', () => {
      const id = generateInitiativeId()

      expect(id).toMatch(/^initiative-/)
    })

    it('should generate unique initiative IDs', () => {
      const id1 = generateInitiativeId()
      const id2 = generateInitiativeId()

      expect(id1).not.toBe(id2)
    })
  })

  describe('generateQuarterId', () => {
    it('should generate quarter ID in correct format', () => {
      const id = generateQuarterId(2025, 1)

      expect(id).toBe('Q1-2025')
    })

    it('should handle all quarter numbers', () => {
      expect(generateQuarterId(2025, 1)).toBe('Q1-2025')
      expect(generateQuarterId(2025, 2)).toBe('Q2-2025')
      expect(generateQuarterId(2025, 3)).toBe('Q3-2025')
      expect(generateQuarterId(2025, 4)).toBe('Q4-2025')
    })

    it('should handle different years', () => {
      expect(generateQuarterId(2024, 2)).toBe('Q2-2024')
      expect(generateQuarterId(2026, 3)).toBe('Q3-2026')
    })
  })
})
