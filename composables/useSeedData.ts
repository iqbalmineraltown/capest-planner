import { useMembersStore } from '~/stores/members'
import { useInitiativesStore } from '~/stores/initiatives'
import { useQuartersStore } from '~/stores/quarters'
import { useRolesStore } from '~/stores/roles'
import { getCurrentQuarterId } from '~/utils/dateUtils'

/**
 * Seed default placeholder data for demo purposes
 * One Piece themed - Straw Hat Pirates!
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

    // Seed Straw Hat Pirates crew members
    const defaultMembers = [
      { name: 'Monkey D. Luffy', roles: ['BE', 'FE'], availability: 12 },      // Captain - versatile
      { name: 'Roronoa Zoro', roles: ['BE'], availability: 13 },               // Swordsman - strong backend
      { name: 'Nami', roles: ['FE'], availability: 10 },                       // Navigator - visualization
      { name: 'Usopp', roles: ['MOBILE'], availability: 11 },                  // Sniper - ranged/mobile
      { name: 'Sanji', roles: ['QA'], availability: 13 },                      // Cook - quality
      { name: 'Tony Tony Chopper', roles: ['BE', 'QA'], availability: 12 },    // Doctor - backend & quality
      { name: 'Nico Robin', roles: ['FE'], availability: 11 },                 // Archaeologist - data
      { name: 'Franky', roles: ['BE'], availability: 13 },                     // Shipwright - builder
      { name: 'Brook', roles: ['MOBILE'], availability: 10 },                  // Musician - communication
    ]

    const createdMembers: string[] = []
    for (const member of defaultMembers) {
      const created = membersStore.addMember(member)
      createdMembers.push(created.id)
    }

    // Seed pirate-themed initiatives
    const defaultInitiatives = [
      {
        name: 'Grand Line Navigation System',
        description: 'Build a real-time navigation system for traversing the Grand Line safely',
        quarter: currentQuarterId,
        roleRequirements: [
          { role: 'BE', effort: 8 },
          { role: 'FE', effort: 6 },
          { role: 'QA', effort: 4 },
        ],
        assignments: [
          { memberId: createdMembers[1], role: 'BE', weeksAllocated: 8, startWeek: 1, isParallel: false },
          { memberId: createdMembers[2], role: 'FE', weeksAllocated: 6, startWeek: 1, isParallel: true },
          { memberId: createdMembers[4], role: 'QA', weeksAllocated: 4, startWeek: 5, isParallel: false },
        ],
      },
      {
        name: 'Thousand Sunny Upgrade',
        description: 'Major upgrade to the ship\'s systems including Coup de Burst optimization',
        quarter: currentQuarterId,
        roleRequirements: [
          { role: 'BE', effort: 10 },
          { role: 'MOBILE', effort: 4 },
          { role: 'QA', effort: 3 },
        ],
        assignments: [
          { memberId: createdMembers[7], role: 'BE', weeksAllocated: 10, startWeek: 1, isParallel: false },
          { memberId: createdMembers[3], role: 'MOBILE', weeksAllocated: 4, startWeek: 1, isParallel: true },
        ],
      },
      {
        name: 'Treasure Map Digitization',
        description: 'Convert ancient treasure maps to digital format with AI analysis',
        quarter: currentQuarterId,
        roleRequirements: [
          { role: 'FE', effort: 6 },
          { role: 'BE', effort: 4 },
          { role: 'QA', effort: 2 },
        ],
        assignments: [
          { memberId: createdMembers[6], role: 'FE', weeksAllocated: 6, startWeek: 1, isParallel: false },
          { memberId: createdMembers[5], role: 'BE', weeksAllocated: 4, startWeek: 2, isParallel: false },
        ],
      },
      {
        name: 'Devil Fruit Database',
        description: 'Comprehensive database of all known Devil Fruits and their abilities',
        quarter: currentQuarterId,
        roleRequirements: [
          { role: 'BE', effort: 5 },
          { role: 'FE', effort: 3 },
        ],
        assignments: [
          { memberId: createdMembers[0], role: 'BE', weeksAllocated: 5, startWeek: 3, isParallel: false },
        ],
      },
      {
        name: 'Marine Evasion Protocol',
        description: 'Early warning system for Marine ships and Buster Calls',
        quarter: currentQuarterId,
        roleRequirements: [
          { role: 'MOBILE', effort: 8 },
          { role: 'QA', effort: 4 },
        ],
        assignments: [
          { memberId: createdMembers[8], role: 'MOBILE', weeksAllocated: 8, startWeek: 1, isParallel: false },
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
