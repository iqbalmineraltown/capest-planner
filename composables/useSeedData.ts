import { useMembersStore } from '~/stores/members'
import { useInitiativesStore } from '~/stores/initiatives'
import { useQuartersStore } from '~/stores/quarters'
import { useRolesStore } from '~/stores/roles'
import { getCurrentQuarterId } from '~/utils/dateUtils'

/**
 * Seed default placeholder data for demo purposes
 */
export function useSeedData() {
  const membersStore = useMembersStore()
  const initiativesStore = useInitiativesStore()
  const quartersStore = useQuartersStore()
  const rolesStore = useRolesStore()

  const isSeeded = ref(false)

  function seedDefaultData() {
    // Only seed once
    if (isSeeded.value) return
    if (membersStore.memberCount > 0) return // Don't seed if data exists

    const currentQuarterId = getCurrentQuarterId()

    // Ensure we have a quarter
    if (!quartersStore.getQuarterById(currentQuarterId)) {
      quartersStore.addQuarter(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) + 1)
    }

    // Seed default members
    const defaultMembers = [
      { name: 'Alice Chen', roles: ['BE', 'FE'], availability: 12 },
      { name: 'Bob Martinez', roles: ['BE'], availability: 13 },
      { name: 'Carol Wang', roles: ['FE'], availability: 10 },
      { name: 'David Kim', roles: ['MOBILE'], availability: 11 },
      { name: 'Eva Patel', roles: ['QA'], availability: 13 },
      { name: 'Frank Liu', roles: ['BE', 'QA'], availability: 12 },
    ]

    const createdMembers: string[] = []
    for (const member of defaultMembers) {
      const created = membersStore.addMember(member)
      createdMembers.push(created.id)
    }

    // Seed default initiatives
    const defaultInitiatives = [
      {
        name: 'API Modernization',
        description: 'Refactor legacy API endpoints to use new architecture',
        quarter: currentQuarterId,
        roleRequirements: [
          { role: 'BE', effort: 8 },
          { role: 'QA', effort: 4 },
        ],
        assignments: [
          { memberId: createdMembers[1], role: 'BE', weeksAllocated: 8, startWeek: 1, isParallel: false },
          { memberId: createdMembers[4], role: 'QA', weeksAllocated: 4, startWeek: 5, isParallel: false },
        ],
      },
      {
        name: 'Mobile App v2.0',
        description: 'Major update to mobile application with new features',
        quarter: currentQuarterId,
        roleRequirements: [
          { role: 'MOBILE', effort: 10 },
          { role: 'BE', effort: 4 },
          { role: 'QA', effort: 3 },
        ],
        assignments: [
          { memberId: createdMembers[3], role: 'MOBILE', weeksAllocated: 10, startWeek: 1, isParallel: false },
          { memberId: createdMembers[0], role: 'BE', weeksAllocated: 4, startWeek: 1, isParallel: true },
        ],
      },
      {
        name: 'Dashboard Redesign',
        description: 'Update dashboard UI with new design system',
        quarter: currentQuarterId,
        roleRequirements: [
          { role: 'FE', effort: 6 },
          { role: 'QA', effort: 2 },
        ],
        assignments: [
          { memberId: createdMembers[2], role: 'FE', weeksAllocated: 6, startWeek: 1, isParallel: false },
        ],
      },
      {
        name: 'Performance Optimization',
        description: 'Optimize database queries and caching strategy',
        quarter: currentQuarterId,
        roleRequirements: [
          { role: 'BE', effort: 5 },
        ],
        assignments: [
          { memberId: createdMembers[5], role: 'BE', weeksAllocated: 5, startWeek: 3, isParallel: false },
        ],
      },
    ]

    for (const initiative of defaultInitiatives) {
      const created = initiativesStore.addInitiative({
        name: initiative.name,
        description: initiative.description,
        quarter: initiative.quarter,
        roleRequirements: initiative.roleRequirements,
      })

      // Add assignments
      for (const assignment of initiative.assignments) {
        initiativesStore.addAssignment(created.id, assignment)
        membersStore.assignToInitiative(assignment.memberId, created.id)
      }
    }

    isSeeded.value = true
  }

  function clearAllData() {
    membersStore.clearAll()
    initiativesStore.clearAll()
    quartersStore.clearAll()
    rolesStore.resetRoles()
    isSeeded.value = false
  }

  return {
    seedDefaultData,
    clearAllData,
    isSeeded,
  }
}
