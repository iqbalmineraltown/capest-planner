/**
 * Get the current quarter number (1-4)
 */
export function getCurrentQuarter(): number {
  const month = new Date().getMonth()
  return Math.floor(month / 3) + 1
}

/**
 * Get the current year
 */
export function getCurrentYear(): number {
  return new Date().getFullYear()
}

/**
 * Get the current quarter ID (e.g., "Q1-2025")
 */
export function getCurrentQuarterId(): string {
  return `Q${getCurrentQuarter()}-${getCurrentYear()}`
}

/**
 * Get quarter start and end dates
 */
export function getQuarterDateRange(year: number, quarter: number): { startDate: Date; endDate: Date } {
  const startMonth = (quarter - 1) * 3
  const startDate = new Date(year, startMonth, 1)
  const endDate = new Date(year, startMonth + 3, 0) // Last day of the last month

  return { startDate, endDate }
}

/**
 * Calculate number of weeks in a quarter
 * Typically 13 weeks, but we calculate for accuracy
 */
export function getWeeksInQuarter(year: number, quarter: number): number {
  const { startDate, endDate } = getQuarterDateRange(year, quarter)
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / msPerWeek)
  return Math.max(13, weeks) // Minimum 13 weeks
}

/**
 * Parse quarter ID into year and quarter number
 */
export function parseQuarterId(quarterId: string): { year: number; quarter: number } | null {
  const match = quarterId.match(/^Q([1-4])-(\d{4})$/)
  if (!match) return null
  return {
    quarter: parseInt(match[1], 10),
    year: parseInt(match[2], 10),
  }
}

/**
 * Get the next quarter ID
 */
export function getNextQuarterId(currentQuarterId: string): string {
  const parsed = parseQuarterId(currentQuarterId)
  if (!parsed) return currentQuarterId

  const { year, quarter } = parsed
  if (quarter === 4) {
    return `Q1-${year + 1}`
  }
  return `Q${quarter + 1}-${year}`
}

/**
 * Format quarter ID for display
 */
export function formatQuarterLabel(quarterId: string): string {
  const parsed = parseQuarterId(quarterId)
  if (!parsed) return quarterId
  return `${parsed.year} Q${parsed.quarter}`
}

/**
 * Get default quarter config for the current quarter
 */
export function getDefaultQuarterConfig(): import('~/types/initiative').QuarterConfig {
  const year = getCurrentYear()
  const quarter = getCurrentQuarter()
  const { startDate, endDate } = getQuarterDateRange(year, quarter)

  return {
    id: getCurrentQuarterId(),
    label: formatQuarterLabel(getCurrentQuarterId()),
    totalWeeks: getWeeksInQuarter(year, quarter),
    startDate,
    endDate,
  }
}
