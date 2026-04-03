/**
 * Role types that can be assigned to team members
 * Default roles are BE, FE, MOBILE, QA but can be customized
 */
export type RoleType = string

/**
 * Quarter availability mapping - quarter ID to manweeks
 */
export type QuarterAvailability = Record<string, number>

/**
 * Team member in the capacity planning system
 */
export interface TeamMember {
  /** Unique identifier */
  id: string
  /** Member's full name */
  name: string
  /** Roles the member can perform (multiple roles supported) */
  roles: RoleType[]
  /** Available manweeks per quarter (quarter ID -> manweeks) */
  quarterAvailability: QuarterAvailability
  /** IDs of assigned initiatives */
  assignedInitiatives: string[]
}

/**
 * Default role types for the system
 */
export const DEFAULT_ROLES: RoleType[] = ['BE', 'FE', 'MOBILE', 'QA']
