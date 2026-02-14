import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import type { QuarterConfig } from '~/types'
import { getDefaultQuarterConfig, formatQuarterLabel, parseQuarterId, getQuarterDateRange, getWeeksInQuarter } from '~/utils/dateUtils'

const STORAGE_KEY = 'capest-quarters'

export const useQuartersStore = defineStore('quarters', () => {
  // Load from localStorage on initialization
  const loadQuarters = (): QuarterConfig[] => {
    if (typeof window === 'undefined') return [getDefaultQuarterConfig()]
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Reconstruct Date objects
      return parsed.map((q: QuarterConfig) => ({
        ...q,
        startDate: new Date(q.startDate),
        endDate: new Date(q.endDate),
      }))
    }
    // Default to current quarter
    return [getDefaultQuarterConfig()]
  }

  const quarters = ref<QuarterConfig[]>(loadQuarters())

  // Persist to localStorage on changes
  watch(
    quarters,
    (newQuarters) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newQuarters))
      }
    },
    { deep: true }
  )

  // Getters
  const quarterCount = computed(() => quarters.value.length)

  const getQuarterById = computed(() => {
    return (id: string): QuarterConfig | undefined =>
      quarters.value.find((q) => q.id === id)
  })

  const sortedQuarters = computed(() => {
    return [...quarters.value].sort((a, b) => {
      const aParsed = parseQuarterId(a.id)
      const bParsed = parseQuarterId(b.id)
      if (!aParsed || !bParsed) return 0
      if (aParsed.year !== bParsed.year) return aParsed.year - bParsed.year
      return aParsed.quarter - bParsed.quarter
    })
  })

  const currentQuarter = computed(() => {
    const defaultConfig = getDefaultQuarterConfig()
    return quarters.value.find((q) => q.id === defaultConfig.id) || quarters.value[0]
  })

  // Actions
  function addQuarter(year: number, quarterNumber: number): QuarterConfig | null {
    // Validate quarter number
    if (quarterNumber < 1 || quarterNumber > 4) return null

    const id = `Q${quarterNumber}-${year}`

    // Check if quarter already exists
    if (quarters.value.some((q) => q.id === id)) return null

    const { startDate, endDate } = getQuarterDateRange(year, quarterNumber)
    const totalWeeks = getWeeksInQuarter(year, quarterNumber)

    const newQuarter: QuarterConfig = {
      id,
      label: formatQuarterLabel(id),
      totalWeeks,
      startDate,
      endDate,
    }

    quarters.value.push(newQuarter)
    return newQuarter
  }

  function removeQuarter(id: string): boolean {
    // Don't allow removing the last quarter
    if (quarters.value.length <= 1) return false

    const index = quarters.value.findIndex((q) => q.id === id)
    if (index === -1) return false

    quarters.value.splice(index, 1)
    return true
  }

  function updateQuarter(
    id: string,
    updates: Partial<Omit<QuarterConfig, 'id'>>
  ): boolean {
    const quarter = quarters.value.find((q) => q.id === id)
    if (!quarter) return false

    Object.assign(quarter, updates)
    return true
  }

  function getOrCreateQuarter(id: string): QuarterConfig {
    const existing = quarters.value.find((q) => q.id === id)
    if (existing) return existing

    const parsed = parseQuarterId(id)
    if (!parsed) throw new Error(`Invalid quarter ID: ${id}`)

    const newQuarter = addQuarter(parsed.year, parsed.quarter)
    if (!newQuarter) throw new Error(`Failed to create quarter: ${id}`)

    return newQuarter
  }

  function clearAll(): void {
    // Reset to default quarter
    quarters.value = [getDefaultQuarterConfig()]
  }

  return {
    quarters,
    quarterCount,
    getQuarterById,
    sortedQuarters,
    currentQuarter,
    addQuarter,
    removeQuarter,
    updateQuarter,
    getOrCreateQuarter,
    clearAll,
  }
})
