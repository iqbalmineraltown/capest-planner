import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useQuartersStore } from '~/stores/quarters'
import { nextTick } from 'vue'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      const { [key]: _, ...remaining } = store
      store = remaining
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    // Helper to access the internal store for assertions
    _getStore: () => store,
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('quartersStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
  })

  describe('initial state', () => {
    it('should start with default quarter', () => {
      const store = useQuartersStore()

      expect(store.quarters.length).toBeGreaterThanOrEqual(1)
      expect(store.quarterCount).toBeGreaterThanOrEqual(1)
    })

    it('should have default quarter with proper ID format', () => {
      const store = useQuartersStore()
      const defaultQuarter = store.quarters[0]

      expect(defaultQuarter.id).toMatch(/^Q[1-4]-\d{4}$/)
      expect(defaultQuarter.label).toBeDefined()
      expect(defaultQuarter.totalWeeks).toBeGreaterThanOrEqual(13)
      expect(defaultQuarter.startDate).toBeInstanceOf(Date)
      expect(defaultQuarter.endDate).toBeInstanceOf(Date)
    })
  })

  describe('addQuarter', () => {
    it('should create quarter with proper ID format', () => {
      const store = useQuartersStore()

      const quarter = store.addQuarter(2025, 1)

      expect(quarter).not.toBeNull()
      expect(quarter!.id).toBe('Q1-2025')
      expect(quarter!.label).toBe('2025 Q1')
      expect(quarter!.totalWeeks).toBeGreaterThanOrEqual(13)
      expect(quarter!.startDate).toBeInstanceOf(Date)
      expect(quarter!.endDate).toBeInstanceOf(Date)
    })

    it('should return null for duplicate quarter', () => {
      const store = useQuartersStore()
      const defaultQuarter = store.quarters[0]
      const parsed = defaultQuarter.id.match(/^Q([1-4])-(\d{4})$/)

      const quarter = store.addQuarter(Number.parseInt(parsed![2], 10), Number.parseInt(parsed![1], 10))

      expect(quarter).toBeNull()
    })

    it('should return null for invalid quarter number', () => {
      const store = useQuartersStore()

      expect(store.addQuarter(2025, 0)).toBeNull()
      expect(store.addQuarter(2025, 5)).toBeNull()
      expect(store.addQuarter(2025, -1)).toBeNull()
    })

    it('should add quarter to the store', () => {
      const store = useQuartersStore()
      const initialCount = store.quarterCount

      store.addQuarter(2026, 1)

      expect(store.quarterCount).toBe(initialCount + 1)
    })

    it('should add multiple quarters', () => {
      const store = useQuartersStore()
      const initialCount = store.quarterCount

      // Add quarters that won't conflict with the default (current) quarter
      store.addQuarter(2027, 1)
      store.addQuarter(2027, 2)

      expect(store.quarterCount).toBe(initialCount + 2)
      expect(store.quarters.some((q) => q.id === 'Q1-2027')).toBe(true)
      expect(store.quarters.some((q) => q.id === 'Q2-2027')).toBe(true)
    })
  })

  describe('removeQuarter', () => {
    it('should remove existing quarter', () => {
      const store = useQuartersStore()
      store.addQuarter(2026, 1)
      const initialCount = store.quarterCount

      const result = store.removeQuarter('Q1-2026')

      expect(result).toBe(true)
      expect(store.quarterCount).toBe(initialCount - 1)
      expect(store.quarters.some((q) => q.id === 'Q1-2026')).toBe(false)
    })

    it('should return false when trying to remove the last quarter', () => {
      const store = useQuartersStore()

      // Remove all extra quarters first
      const extraQuarters = store.quarters.filter((_, i) => i > 0)
      extraQuarters.forEach((q) => store.removeQuarter(q.id))

      const result = store.removeQuarter(store.quarters[0].id)

      expect(result).toBe(false)
      expect(store.quarterCount).toBe(1)
    })

    it('should return false for non-existent quarter', () => {
      const store = useQuartersStore()

      const result = store.removeQuarter('Q9-9999')

      expect(result).toBe(false)
    })
  })

  describe('updateQuarter', () => {
    it('should update quarter fields', () => {
      const store = useQuartersStore()
      const quarter = store.quarters[0]
      const _originalLabel = quarter.label

      const result = store.updateQuarter(quarter.id, {
        label: 'Custom Label',
        totalWeeks: 14,
      })

      expect(result).toBe(true)
      expect(store.getQuarterById(quarter.id)?.label).toBe('Custom Label')
      expect(store.getQuarterById(quarter.id)?.totalWeeks).toBe(14)
    })

    it('should update date fields', () => {
      const store = useQuartersStore()
      const quarter = store.quarters[0]
      const newStartDate = new Date(2025, 0, 1)
      const newEndDate = new Date(2025, 2, 31)

      const result = store.updateQuarter(quarter.id, {
        startDate: newStartDate,
        endDate: newEndDate,
      })

      expect(result).toBe(true)
      const updated = store.getQuarterById(quarter.id)
      expect(updated?.startDate).toEqual(newStartDate)
      expect(updated?.endDate).toEqual(newEndDate)
    })

    it('should return false for non-existent quarter', () => {
      const store = useQuartersStore()

      const result = store.updateQuarter('Q9-9999', { label: 'Test' })

      expect(result).toBe(false)
    })
  })

  describe('getOrCreateQuarter', () => {
    it('should return existing quarter', () => {
      const store = useQuartersStore()
      const existingQuarter = store.quarters[0]

      const result = store.getOrCreateQuarter(existingQuarter.id)

      expect(result).toEqual(existingQuarter)
    })

    it('should create new quarter if it does not exist', () => {
      const store = useQuartersStore()

      const result = store.getOrCreateQuarter('Q3-2027')

      expect(result.id).toBe('Q3-2027')
      expect(result.label).toBe('2027 Q3')
      expect(store.quarters.some((q) => q.id === 'Q3-2027')).toBe(true)
    })

    it('should throw error for invalid quarter ID', () => {
      const store = useQuartersStore()

      expect(() => store.getOrCreateQuarter('invalid-id')).toThrow('Invalid quarter ID: invalid-id')
    })
  })

  describe('clearAll', () => {
    it('should reset to default quarter', () => {
      const store = useQuartersStore()
      store.addQuarter(2026, 1)
      store.addQuarter(2026, 2)

      store.clearAll()

      expect(store.quarterCount).toBe(1)
      expect(store.quarters[0]).toBeDefined()
    })

    it('should set default quarter with correct ID format', () => {
      const store = useQuartersStore()
      store.addQuarter(2026, 1)

      store.clearAll()

      expect(store.quarters[0].id).toMatch(/^Q[1-4]-\d{4}$/)
    })
  })

  describe('getters', () => {
    describe('getQuarterById', () => {
      it('should return quarter by ID', () => {
        const store = useQuartersStore()
        const quarter = store.quarters[0]

        const result = store.getQuarterById(quarter.id)

        expect(result).toEqual(quarter)
      })

      it('should return undefined for non-existent quarter', () => {
        const store = useQuartersStore()

        const result = store.getQuarterById('Q9-9999')

        expect(result).toBeUndefined()
      })
    })

    describe('sortedQuarters', () => {
      it('should sort quarters chronologically', () => {
        const store = useQuartersStore()
        store.addQuarter(2026, 1)
        store.addQuarter(2025, 4)

        const sorted = store.sortedQuarters

        for (let i = 0; i < sorted.length - 1; i++) {
          const aMatch = sorted[i].id.match(/^Q([1-4])-(\d{4})$/)
          const bMatch = sorted[i + 1].id.match(/^Q([1-4])-(\d{4})$/)

          if (aMatch && bMatch) {
            const aYear = Number.parseInt(aMatch[2], 10)
            const bYear = Number.parseInt(bMatch[2], 10)
            const aQuarter = Number.parseInt(aMatch[1], 10)
            const bQuarter = Number.parseInt(bMatch[1], 10)

            if (aYear === bYear) {
              expect(aQuarter).toBeLessThanOrEqual(bQuarter)
            } else {
              expect(aYear).toBeLessThanOrEqual(bYear)
            }
          }
        }
      })

      it('should sort by year first, then quarter', () => {
        const store = useQuartersStore()
        store.addQuarter(2027, 1)
        store.addQuarter(2025, 4)
        store.addQuarter(2026, 2)

        const sorted = store.sortedQuarters
        const ids = sorted.map((q) => q.id)

        const q4_2025Index = ids.indexOf('Q4-2025')
        const q2_2026Index = ids.indexOf('Q2-2026')
        const q1_2027Index = ids.indexOf('Q1-2027')

        expect(q4_2025Index).toBeLessThan(q2_2026Index)
        expect(q2_2026Index).toBeLessThan(q1_2027Index)
      })
    })

    describe('currentQuarter', () => {
      it('should return the default quarter as current', () => {
        const store = useQuartersStore()

        expect(store.currentQuarter).toBeDefined()
        expect(store.currentQuarter!.id).toMatch(/^Q[1-4]-\d{4}$/)
      })
    })
  })

  describe('localStorage persistence', () => {
    it('should save quarters to localStorage on add', async () => {
      const store = useQuartersStore()

      store.addQuarter(2027, 1)
      await nextTick()

      const savedData = JSON.parse(localStorageMock._getStore()['capest-quarters'])
      expect(savedData.some((q: any) => q.id === 'Q1-2027')).toBe(true)
    })

    it('should save quarters to localStorage on remove', async () => {
      const store = useQuartersStore()
      store.addQuarter(2027, 1)
      await nextTick()

      const countBefore = store.quarterCount
      store.removeQuarter('Q1-2027')
      await nextTick()

      const savedData = JSON.parse(localStorageMock._getStore()['capest-quarters'])
      expect(savedData.length).toBe(countBefore - 1)
      expect(savedData.some((q: any) => q.id === 'Q1-2027')).toBe(false)
    })

    it('should save quarters to localStorage on update', async () => {
      const store = useQuartersStore()
      const quarter = store.quarters[0]

      store.updateQuarter(quarter.id, { label: 'Updated Label' })
      await nextTick()

      const savedData = JSON.parse(localStorageMock._getStore()['capest-quarters'])
      const updated = savedData.find((q: any) => q.id === quarter.id)
      expect(updated.label).toBe('Updated Label')
    })

    it('should load quarters from localStorage on initialization', () => {
      const storedQuarters = [
        { id: 'Q1-2025', label: '2025 Q1', totalWeeks: 13, startDate: '2025-01-01T00:00:00.000Z', endDate: '2025-03-31T00:00:00.000Z' },
        { id: 'Q2-2025', label: '2025 Q2', totalWeeks: 13, startDate: '2025-04-01T00:00:00.000Z', endDate: '2025-06-30T00:00:00.000Z' },
      ]
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(storedQuarters))

      // Create a new pinia instance to trigger store initialization
      setActivePinia(createPinia())
      const store = useQuartersStore()

      expect(store.quarterCount).toBe(2)
      expect(store.quarters[0].id).toBe('Q1-2025')
      expect(store.quarters[1].id).toBe('Q2-2025')
      expect(store.quarters[0].startDate).toBeInstanceOf(Date)
      expect(store.quarters[0].endDate).toBeInstanceOf(Date)
    })

    it('should use default quarter when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValueOnce(null)

      setActivePinia(createPinia())
      const store = useQuartersStore()

      expect(store.quarterCount).toBe(1)
      expect(store.quarters[0].id).toMatch(/^Q[1-4]-\d{4}$/)
    })
  })

  describe('quarter ID parsing and sorting', () => {
    it('should correctly parse quarter IDs for sorting', () => {
      const store = useQuartersStore()
      store.addQuarter(2025, 1)
      store.addQuarter(2025, 2)
      store.addQuarter(2026, 1)

      const sorted = store.sortedQuarters
      const ids = sorted.map((q) => q.id)

      const q1_2025Index = ids.findIndex((id) => id === 'Q1-2025')
      const q2_2025Index = ids.findIndex((id) => id === 'Q2-2025')
      const q1_2026Index = ids.findIndex((id) => id === 'Q1-2026')

      expect(q1_2025Index).toBeGreaterThanOrEqual(0)
      expect(q2_2025Index).toBeGreaterThan(q1_2025Index)
      expect(q1_2026Index).toBeGreaterThan(q2_2025Index)
    })

    it('should handle quarters across year boundaries', () => {
      const store = useQuartersStore()
      store.addQuarter(2025, 4)
      store.addQuarter(2026, 1)

      const sorted = store.sortedQuarters
      const ids = sorted.map((q) => q.id)

      const q4_2025Index = ids.indexOf('Q4-2025')
      const q1_2026Index = ids.indexOf('Q1-2026')

      expect(q4_2025Index).toBeLessThan(q1_2026Index)
    })
  })
})
