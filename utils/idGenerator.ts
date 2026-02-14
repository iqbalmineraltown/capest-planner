/**
 * Generate a unique identifier
 * Uses timestamp + random string for uniqueness
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 9)
  return prefix ? `${prefix}-${timestamp}-${randomPart}` : `${timestamp}-${randomPart}`
}

/**
 * Generate a member ID
 */
export function generateMemberId(): string {
  return generateId('member')
}

/**
 * Generate an initiative ID
 */
export function generateInitiativeId(): string {
  return generateId('initiative')
}

/**
 * Generate a quarter ID from year and quarter number
 */
export function generateQuarterId(year: number, quarter: number): string {
  return `Q${quarter}-${year}`
}
