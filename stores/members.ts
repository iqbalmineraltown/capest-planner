import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import type { TeamMember } from '~/types'
import { generateMemberId } from '~/utils/idGenerator'
import { useInitiativesStore } from '~/stores/initiatives'

const STORAGE_KEY = 'capest-members'

export const useMembersStore = defineStore('members', () => {
  // Load from localStorage on initialization
  const loadMembers = (): TeamMember[] => {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
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

  function clearAll(): void {
    members.value = []
  }

  return {
    members,
    memberCount,
    getMemberById,
    getMembersByRole,
    getMembersForInitiative,
    addMember,
    updateMember,
    removeMember,
    assignToInitiative,
    unassignFromInitiative,
    clearAll,
  }
})
