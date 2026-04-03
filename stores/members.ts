import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import type { TeamMember, QuarterAvailability } from '~/types'
import { generateMemberId } from '~/utils/idGenerator'
import { getDefaultQuarterConfig } from '~/utils/dateUtils'
import { useInitiativesStore } from '~/stores/initiatives'

const STORAGE_KEY = 'capest-members'

export const useMembersStore = defineStore('members', () => {
  // Load from localStorage on initialization
  const loadMembers = (): TeamMember[] => {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      let parsed: any[]
      try {
        parsed = JSON.parse(stored)
      } catch {
        console.warn('Failed to parse members data, resetting to empty')
        return []
      }
      // Migrate old data: if member has 'availability' but not 'quarterAvailability'
      return parsed.map((m: any) => {
        if (m.availability !== undefined && !m.quarterAvailability) {
          // Migrate: convert old availability to quarterAvailability for current quarter
          const defaultQuarter = getDefaultQuarterConfig()
          return {
            ...m,
            quarterAvailability: {
              [defaultQuarter.id]: m.availability
            }
          }
        }
        return m
      })
    }
    return []
  }

  const members = ref<TeamMember[]>(loadMembers())

  // Persist to localStorage on changes
  watch(
    members,
    (newMembers) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newMembers))
      }
    },
    { deep: true }
  )

  // Getters
  const memberCount = computed(() => members.value.length)

  const getMemberById = computed(() => {
    return (id: string): TeamMember | undefined => members.value.find((m) => m.id === id)
  })

  const getMembersByRole = computed(() => {
    return (role: string): TeamMember[] =>
      members.value.filter((m) => m.roles.includes(role))
  })

  const getMembersForInitiative = computed(() => {
    return (initiativeId: string): TeamMember[] =>
      members.value.filter((m) => m.assignedInitiatives.includes(initiativeId))
  })

  // Get members available for a specific quarter
  const getMembersForQuarter = computed(() => {
    return (quarterId: string): TeamMember[] =>
      members.value.filter((m) => {
        const availability = m.quarterAvailability[quarterId] ?? 0
        return availability > 0
      })
  })

  // Actions
  function addMember(member: Omit<TeamMember, 'id' | 'assignedInitiatives'>): TeamMember {
    const newMember: TeamMember = {
      ...member,
      id: generateMemberId(),
      assignedInitiatives: [],
    }
    members.value.push(newMember)
    return newMember
  }

  function updateMember(id: string, updates: Partial<Omit<TeamMember, 'id'>>): boolean {
    const index = members.value.findIndex((m) => m.id === id)
    if (index === -1) return false

    members.value[index] = {
      ...members.value[index],
      ...updates,
    }
    return true
  }

  function removeMember(id: string): boolean {
    const index = members.value.findIndex((m) => m.id === id)
    if (index === -1) return false

    // Cascade: remove this member's assignments from all initiatives
    const initiativesStore = useInitiativesStore()
    for (const initiative of initiativesStore.initiatives) {
      const assignmentIndices = initiative.assignments
        .map((a, i) => (a.memberId === id ? i : -1))
        .filter((i) => i !== -1)
        .reverse() // Remove from end to preserve indices
      for (const idx of assignmentIndices) {
        initiativesStore.removeAssignment(initiative.id, idx)
      }
    }

    members.value.splice(index, 1)
    return true
  }

  function assignToInitiative(memberId: string, initiativeId: string): boolean {
    const member = members.value.find((m) => m.id === memberId)
    if (!member) return false

    if (!member.assignedInitiatives.includes(initiativeId)) {
      member.assignedInitiatives.push(initiativeId)
    }
    return true
  }

  function unassignFromInitiative(memberId: string, initiativeId: string): boolean {
    const member = members.value.find((m) => m.id === memberId)
    if (!member) return false

    const index = member.assignedInitiatives.indexOf(initiativeId)
    if (index > -1) {
      member.assignedInitiatives.splice(index, 1)
    }
    return true
  }

  // Update member's availability for a specific quarter
  function updateQuarterAvailability(memberId: string, quarterId: string, manweeks: number): boolean {
    const member = members.value.find((m) => m.id === memberId)
    if (!member) return false

    member.quarterAvailability[quarterId] = manweeks
    return true
  }

  // Get availability for a specific quarter
  function getQuarterAvailability(memberId: string, quarterId: string): number {
    const member = members.value.find((m) => m.id === memberId)
    if (!member) return 0
    return member.quarterAvailability[quarterId] ?? 0
  }

  function clearAll(): void {
    members.value = []
  }

  return {
    members,
    memberCount,
    getMemberById,
    getMembersByRole,
    getMembersForInitiative,
    getMembersForQuarter,
    addMember,
    updateMember,
    removeMember,
    assignToInitiative,
    unassignFromInitiative,
    updateQuarterAvailability,
    getQuarterAvailability,
    clearAll,
  }
})
