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

/**
 * Check week conflicts across all initiatives for a member
 * Returns conflicting weeks and which initiatives they belong to
 */
export function checkWeekConflicts(
  memberId: string,
  startWeek: number,
  weeksAllocated: number,
  initiatives: Initiative[],
  quarterId: string,
  excludeInitiativeId?: string,
  excludeAssignmentIndex?: number
): {
  hasConflict: boolean
  conflictingWeeks: number[]
  conflicts: Array<{ initiativeId: string; initiativeName: string; weeks: number[] }>
} {
  const newWeeks = Array.from({ length: weeksAllocated }, (_, i) => startWeek + i)
  const conflicts: Array<{ initiativeId: string; initiativeName: string; weeks: number[] }> = []
  const conflictingWeeks: number[] = []

  for (const initiative of initiatives) {
    if (initiative.quarter !== quarterId) continue
    if (excludeInitiativeId && initiative.id === excludeInitiativeId) continue

    for (let i = 0; i < initiative.assignments.length; i++) {
      // Skip the assignment being edited
      if (excludeInitiativeId && initiative.id === excludeInitiativeId && i === excludeAssignmentIndex) {
        continue
      }

      const assignment = initiative.assignments[i]
      if (assignment.memberId !== memberId) continue

      const assignedWeeks = Array.from(
        { length: assignment.weeksAllocated },
        (_, j) => assignment.startWeek + j
      )

      const overlap = newWeeks.filter((week) => assignedWeeks.includes(week))
      if (overlap.length > 0) {
        conflicts.push({
          initiativeId: initiative.id,
          initiativeName: initiative.name,
          weeks: overlap,
        })
        conflictingWeeks.push(...overlap)
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflictingWeeks: [...new Set(conflictingWeeks)].sort((a, b) => a - b),
    conflicts,
  }
}

/**
 * Get initiative warnings (over-capacity members, unfilled roles)
 */
export function getInitiativeWarnings(
  initiative: Initiative,
  members: TeamMember[],
  allInitiatives: Initiative[],
  quarterId: string
): {
  hasWarnings: boolean
  overCapacityMembers: string[]
  unfilledRoles: Array<{ role: RoleType; required: number; assigned: number }>
  weekConflicts: Array<{ memberId: string; memberName: string; conflicts: string[] }>
} {
  const overCapacityMembers: string[] = []
  const unfilledRoles: Array<{ role: RoleType; required: number; assigned: number }> = []
  const weekConflicts: Array<{ memberId: string; memberName: string; conflicts: string[] }> = []

  // Check for over-capacity members
  for (const assignment of initiative.assignments) {
    const member = members.find((m) => m.id === assignment.memberId)
    if (!member) continue

    const capacity = calculateMemberQuarterCapacity(member, allInitiatives, quarterId)
    if (capacity.remaining < 0 && !overCapacityMembers.includes(member.name)) {
      overCapacityMembers.push(member.name)
    }

    // Check for week conflicts
    const conflictResult = checkWeekConflicts(
      assignment.memberId,
      assignment.startWeek,
      assignment.weeksAllocated,
      allInitiatives,
      quarterId,
      initiative.id
    )

    if (conflictResult.hasConflict) {
      const conflictDescriptions = conflictResult.conflicts.map(
        (c) => `${c.initiativeName} (Week ${c.weeks.join(', ')})`
      )
      weekConflicts.push({
        memberId: assignment.memberId,
        memberName: member.name,
        conflicts: conflictDescriptions,
      })
    }
  }

  // Check for unfilled roles
  for (const requirement of initiative.roleRequirements) {
    const assignedEffort = initiative.assignments
      .filter((a) => a.role === requirement.role)
      .reduce((sum, a) => sum + a.weeksAllocated, 0)

    if (assignedEffort < requirement.effort) {
      unfilledRoles.push({
        role: requirement.role,
        required: requirement.effort,
        assigned: assignedEffort,
      })
    }
  }

  const hasWarnings =
    overCapacityMembers.length > 0 || unfilledRoles.length > 0 || weekConflicts.length > 0

  return {
    hasWarnings,
    overCapacityMembers,
    unfilledRoles,
    weekConflicts,
  }
}

/**
 * Get role fulfillment progress for an initiative
 */
export function getRoleFulfillment(
  initiative: Initiative
): Array<{
  role: RoleType
  required: number
  assigned: number
  percentage: number
  assignees: Array<{ memberId: string; memberName?: string; weeksAllocated: number }>
}> {
  return initiative.roleRequirements.map((requirement) => {
    const relevantAssignments = initiative.assignments.filter((a) => a.role === requirement.role)
    const assignedEffort = relevantAssignments.reduce((sum, a) => sum + a.weeksAllocated, 0)

    const assignees = relevantAssignments.map((a) => ({
      memberId: a.memberId,
      weeksAllocated: a.weeksAllocated,
    }))

    const percentage = requirement.effort > 0 ? Math.min(100, (assignedEffort / requirement.effort) * 100) : 0

    return {
      role: requirement.role,
      required: requirement.effort,
      assigned: assignedEffort,
      percentage,
      assignees,
    }
  })
}
