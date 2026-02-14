import { computed, type ComputedRef } from 'vue'
import type {
  TeamMember,
  Initiative,
  QuarterConfig,
  MemberCapacity,
  QuarterCapacitySummary,
  RoleType,
} from '~/types'
import {
  calculateMemberQuarterCapacity,
  calculateQuarterCapacitySummary,
  detectOverAllocation,
  getAssignmentsForWeek,
  getAvailableMembersForRole,
  checkCarryOver,
} from '~/utils/capacityCalculator'
import { useMembersStore } from '~/stores/members'
import { useInitiativesStore } from '~/stores/initiatives'
import { useQuartersStore } from '~/stores/quarters'

/**
 * Composable for capacity calculations using store data
 */
export function useCapacityCalc() {
  const membersStore = useMembersStore()
  const initiativesStore = useInitiativesStore()
  const quartersStore = useQuartersStore()

  /**
   * Get capacity summary for a specific member in a quarter
   */
  const getMemberCapacity = (
    memberId: string,
    quarterId: string
  ): ComputedRef<MemberCapacity | null> => {
    return computed(() => {
      const member = membersStore.getMemberById(memberId)
      if (!member) return null

      return calculateMemberQuarterCapacity(
        member,
        initiativesStore.initiatives,
        quarterId
      )
    })
  }

  /**
   * Get complete quarter capacity summary
   */
  const getQuarterSummary = (
    quarterId: string
  ): ComputedRef<QuarterCapacitySummary | null> => {
    return computed(() => {
      const quarter = quartersStore.getQuarterById(quarterId)
      if (!quarter) return null

      return calculateQuarterCapacitySummary(
        membersStore.members,
        initiativesStore.initiatives,
        quarter
      )
    })
  }

  /**
   * Get over-allocated members for a quarter
   */
  const getOverAllocations = (quarterId: string) => {
    return computed(() =>
      detectOverAllocation(
        membersStore.members,
        initiativesStore.initiatives,
        quarterId
      )
    )
  }

  /**
   * Get assignments for a specific week
   */
  const getWeekAssignments = (quarterId: string, weekNumber: number) => {
    return computed(() =>
      getAssignmentsForWeek(initiativesStore.initiatives, quarterId, weekNumber)
    )
  }

  /**
   * Get available members for a role in a quarter
   */
  const getAvailableForRole = (role: RoleType, quarterId: string) => {
    return computed(() =>
      getAvailableMembersForRole(
        membersStore.members,
        role,
        initiativesStore.initiatives,
        quarterId
      )
    )
  }

  /**
   * Check if an assignment carries over
   */
  const checkAssignmentCarryOver = (quarterId: string, assignment: {
    startWeek: number
    weeksAllocated: number
  }) => {
    const quarter = quartersStore.getQuarterById(quarterId)
    if (!quarter) return { carriesOver: false, carriedWeeks: 0, inQuarterWeeks: assignment.weeksAllocated }
    return checkCarryOver(assignment as any, quarter)
  }

  return {
    getMemberCapacity,
    getQuarterSummary,
    getOverAllocations,
    getWeekAssignments,
    getAvailableForRole,
    checkAssignmentCarryOver,
  }
}
