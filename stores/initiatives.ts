import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'
import type { Initiative, Assignment, RoleRequirement } from '~/types'
import { generateInitiativeId } from '~/utils/idGenerator'
import { useMembersStore } from '~/stores/members'

const STORAGE_KEY = 'capest-initiatives'

export const useInitiativesStore = defineStore('initiatives', () => {
  // Load from localStorage on initialization
  const loadInitiatives = (): Initiative[] => {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  }

  const initiatives = ref<Initiative[]>(loadInitiatives())

  // Persist to localStorage on changes
  watch(
    initiatives,
    (newInitiatives) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newInitiatives))
      }
    },
    { deep: true }
  )

  // Getters
  const initiativeCount = computed(() => initiatives.value.length)

  const getInitiativeById = computed(() => {
    return (id: string): Initiative | undefined =>
      initiatives.value.find((i) => i.id === id)
  })

  const getInitiativesByQuarter = computed(() => {
    return (quarterId: string): Initiative[] =>
      initiatives.value.filter((i) => i.quarter === quarterId)
  })

  const getInitiativesForMember = computed(() => {
    return (memberId: string): Initiative[] =>
      initiatives.value.filter((i) =>
        i.assignments.some((a) => a.memberId === memberId)
      )
  })

  // Actions
  function addInitiative(
    initiative: Omit<Initiative, 'id' | 'assignments' | 'carriesOverTo'>
  ): Initiative {
    const newInitiative: Initiative = {
      ...initiative,
      id: generateInitiativeId(),
      assignments: [],
      carriesOverTo: undefined,
    }
    initiatives.value.push(newInitiative)
    return newInitiative
  }

  function updateInitiative(
    id: string,
    updates: Partial<Omit<Initiative, 'id'>>
  ): boolean {
    const index = initiatives.value.findIndex((i) => i.id === id)
    if (index === -1) return false

    initiatives.value[index] = {
      ...initiatives.value[index],
      ...updates,
    }
    return true
  }

  function removeInitiative(id: string): boolean {
    const index = initiatives.value.findIndex((i) => i.id === id)
    if (index === -1) return false

    // Cascade: unassign this initiative from all members
    const membersStore = useMembersStore()
    for (const member of membersStore.members) {
      const assignIdx = member.assignedInitiatives.indexOf(id)
      if (assignIdx > -1) {
        member.assignedInitiatives.splice(assignIdx, 1)
      }
    }

    initiatives.value.splice(index, 1)
    return true
  }

  function addRoleRequirement(
    initiativeId: string,
    requirement: RoleRequirement
  ): boolean {
    const initiative = initiatives.value.find((i) => i.id === initiativeId)
    if (!initiative) return false

    initiative.roleRequirements.push(requirement)
    return true
  }

  function removeRoleRequirement(
    initiativeId: string,
    roleIndex: number
  ): boolean {
    const initiative = initiatives.value.find((i) => i.id === initiativeId)
    if (!initiative || roleIndex < 0 || roleIndex >= initiative.roleRequirements.length) {
      return false
    }

    initiative.roleRequirements.splice(roleIndex, 1)
    return true
  }

  function addAssignment(initiativeId: string, assignment: Assignment): boolean {
    const initiative = initiatives.value.find((i) => i.id === initiativeId)
    if (!initiative) return false

    initiative.assignments.push(assignment)
    return true
  }

  function updateAssignment(
    initiativeId: string,
    memberIndex: number,
    updates: Partial<Assignment>
  ): boolean {
    const initiative = initiatives.value.find((i) => i.id === initiativeId)
    if (!initiative || memberIndex < 0 || memberIndex >= initiative.assignments.length) {
      return false
    }

    initiative.assignments[memberIndex] = {
      ...initiative.assignments[memberIndex],
      ...updates,
    }
    return true
  }

  function removeAssignment(initiativeId: string, memberIndex: number): boolean {
    const initiative = initiatives.value.find((i) => i.id === initiativeId)
    if (!initiative || memberIndex < 0 || memberIndex >= initiative.assignments.length) {
      return false
    }

    initiative.assignments.splice(memberIndex, 1)
    return true
  }

  function setCarryOver(initiativeId: string, nextQuarterId: string | undefined): boolean {
    const initiative = initiatives.value.find((i) => i.id === initiativeId)
    if (!initiative) return false

    initiative.carriesOverTo = nextQuarterId
    return true
  }

  function clearAll(): void {
    initiatives.value = []
  }

  return {
    initiatives,
    initiativeCount,
    getInitiativeById,
    getInitiativesByQuarter,
    getInitiativesForMember,
    addInitiative,
    updateInitiative,
    removeInitiative,
    addRoleRequirement,
    removeRoleRequirement,
    addAssignment,
    updateAssignment,
    removeAssignment,
    setCarryOver,
    clearAll,
  }
})
