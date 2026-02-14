import type {
  TeamMember,
  Initiative,
  Assignment,
  QuarterConfig,
  MemberCapacity,
  QuarterCapacitySummary,
  RoleType,
} from '~/types'

/**
 * Calculate capacity for a member in a specific quarter
 */
export function calculateMemberQuarterCapacity(
  member: TeamMember,
  initiatives: Initiative[],
  quarterId: string
): MemberCapacity {
  // Get all assignments for this member in this quarter
  const memberInitiatives = initiatives.filter(
    (i) => i.quarter === quarterId && i.assignments.some((a) => a.memberId === member.id)
  )

  // Sum up allocated weeks
  let allocated = 0
  for (const initiative of memberInitiatives) {
    const assignments = initiative.assignments.filter((a) => a.memberId === member.id)
    for (const assignment of assignments) {
      allocated += assignment.weeksAllocated
    }
  }

  const remaining = member.availability - allocated

  return {
    memberId: member.id,
    memberName: member.name,
    available: member.availability,
    allocated,
    remaining,
    isOverAllocated: remaining < 0,
  }
}

/**
 * Get all assignments for a specific week in a quarter
 */
export function getAssignmentsForWeek(
  initiatives: Initiative[],
  quarterId: string,
  weekNumber: number
): Array<{ initiative: Initiative; assignment: Assignment }> {
  const result: Array<{ initiative: Initiative; assignment: Assignment }> = []

  for (const initiative of initiatives) {
    if (initiative.quarter !== quarterId) continue

    for (const assignment of initiative.assignments) {
      const endWeek = assignment.startWeek + assignment.weeksAllocated - 1
      if (weekNumber >= assignment.startWeek && weekNumber <= endWeek) {
        result.push({ initiative, assignment })
      }
    }
  }

  return result
}

/**
 * Detect members who are over-allocated in a quarter
 */
export function detectOverAllocation(
  members: TeamMember[],
  initiatives: Initiative[],
  quarterId: string
): Array<{ memberId: string; memberName: string; excessWeeks: number }> {
  const result: Array<{ memberId: string; memberName: string; excessWeeks: number }> = []

  for (const member of members) {
    const capacity = calculateMemberQuarterCapacity(member, initiatives, quarterId)
    if (capacity.remaining < 0) {
      result.push({
        memberId: member.id,
        memberName: member.name,
        excessWeeks: Math.abs(capacity.remaining),
      })
    }
  }

  return result
}

/**
 * Calculate complete quarter capacity summary
 */
export function calculateQuarterCapacitySummary(
  members: TeamMember[],
  initiatives: Initiative[],
  quarterConfig: QuarterConfig
): QuarterCapacitySummary {
  const memberCapacities = members.map((member) =>
    calculateMemberQuarterCapacity(member, initiatives, quarterConfig.id)
  )

  const totalAvailable = members.reduce((sum, m) => sum + m.availability, 0)
  const totalAllocated = memberCapacities.reduce((sum, c) => sum + c.allocated, 0)

  const overAllocatedMembers = memberCapacities
    .filter((c) => c.isOverAllocated)
    .map((c) => c.memberId)

  // Find unassigned role requirements
  const unassignedRequirements: Array<{
    initiativeId: string
    initiativeName: string
    role: RoleType
    effort: number
  }> = []

  const quarterInitiatives = initiatives.filter((i) => i.quarter === quarterConfig.id)

  for (const initiative of quarterInitiatives) {
    for (const requirement of initiative.roleRequirements) {
      const assignedEffort = initiative.assignments
        .filter((a) => a.role === requirement.role)
        .reduce((sum, a) => sum + a.weeksAllocated, 0)

      if (assignedEffort < requirement.effort) {
        unassignedRequirements.push({
          initiativeId: initiative.id,
          initiativeName: initiative.name,
          role: requirement.role,
          effort: requirement.effort - assignedEffort,
        })
      }
    }
  }

  return {
    quarterId: quarterConfig.id,
    totalAvailable,
    totalAllocated,
    memberCapacities,
    overAllocatedMembers,
    unassignedRequirements,
  }
}

/**
 * Check if an assignment spans beyond the quarter
 */
export function checkCarryOver(
  assignment: Assignment,
  quarterConfig: QuarterConfig
): { carriesOver: boolean; carriedWeeks: number; inQuarterWeeks: number } {
  const endWeek = assignment.startWeek + assignment.weeksAllocated - 1

  if (endWeek <= quarterConfig.totalWeeks) {
    return {
      carriesOver: false,
      carriedWeeks: 0,
      inQuarterWeeks: assignment.weeksAllocated,
    }
  }

  const inQuarterWeeks = quarterConfig.totalWeeks - assignment.startWeek + 1
  const carriedWeeks = endWeek - quarterConfig.totalWeeks

  return {
    carriesOver: true,
    carriedWeeks,
    inQuarterWeeks,
  }
}

/**
 * Get members available for a specific role
 */
export function getAvailableMembersForRole(
  members: TeamMember[],
  role: RoleType,
  initiatives: Initiative[],
  quarterId: string
): Array<{ member: TeamMember; currentAllocation: number; remainingCapacity: number }> {
  return members
    .filter((m) => m.roles.includes(role))
    .map((member) => {
      const capacity = calculateMemberQuarterCapacity(member, initiatives, quarterId)
      return {
        member,
        currentAllocation: capacity.allocated,
        remainingCapacity: capacity.remaining,
      }
    })
    .sort((a, b) => b.remainingCapacity - a.remainingCapacity)
}
