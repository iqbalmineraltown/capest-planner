import type { RoleType } from './member'

/**
 * Role requirement for an initiative
 */
export interface RoleRequirement {
  /** Role type needed */
  role: RoleType
  /** Estimated effort in manweeks */
  effort: number
}

/**
 * Assignment of a member to an initiative
 */
export interface Assignment {
  /** ID of the assigned team member */
  memberId: string
  /** Role being performed */
  role: RoleType
  /** Number of weeks allocated */
  weeksAllocated: number
  /** Starting week number in the quarter (1-indexed) */
  startWeek: number
  /** Whether this runs parallel with other assignments */
  isParallel: boolean
  /** Whether this assignment carries over to next quarter */
  carriesOver?: boolean
  /** Remaining weeks if carrying over */
  carriedWeeks?: number
}

/**
 * Initiative in the capacity planning system
 */
export interface Initiative {
  /** Unique identifier */
  id: string
  /** Initiative name */
  name: string
  /** Detailed description */
  description: string
  /** Quarter ID (e.g., "Q1-2025") */
  quarter: string
  /** Role requirements for this initiative */
  roleRequirements: RoleRequirement[]
  /** Member assignments */
  assignments: Assignment[]
  /** Next quarter ID if initiative spans beyond current quarter */
  carriesOverTo?: string
}

/**
 * Quarter configuration
 */
export interface QuarterConfig {
  /** Unique identifier (e.g., "Q1-2025") */
  id: string
  /** Display label */
  label: string
  /** Total weeks in the quarter (typically 13) */
  totalWeeks: number
  /** Quarter start date */
  startDate: Date
  /** Quarter end date */
  endDate: Date
}

/**
 * Capacity summary for a member in a quarter
 */
export interface MemberCapacity {
  memberId: string
  memberName: string
  available: number
  allocated: number
  remaining: number
  isOverAllocated: boolean
}

/**
 * Quarter capacity summary
 */
export interface QuarterCapacitySummary {
  quarterId: string
  totalAvailable: number
  totalAllocated: number
  memberCapacities: MemberCapacity[]
  overAllocatedMembers: string[]
  unassignedRequirements: Array<{
    initiativeId: string
    initiativeName: string
    role: RoleType
    effort: number
  }>
}

/**
 * Warnings for an initiative
 */
export interface InitiativeWarnings {
  hasWarnings: boolean
  overCapacityMembers: string[]
  unfilledRoles: Array<{ role: RoleType; required: number; assigned: number }>
  weekConflicts: Array<{ memberId: string; memberName: string; conflicts: string[] }>
}

/**
 * Role fulfillment progress for an initiative
 */
export interface RoleFulfillment {
  role: RoleType
  required: number
  assigned: number
  percentage: number
  assignees: Array<{ memberId: string; memberName?: string; weeksAllocated: number }>
}
