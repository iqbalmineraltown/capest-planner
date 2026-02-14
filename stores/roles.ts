import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { DEFAULT_ROLES } from '~/types'

const STORAGE_KEY = 'capest-roles'

export const useRolesStore = defineStore('roles', () => {
  // Load from localStorage on initialization
  const loadRoles = (): string[] => {
    if (typeof window === 'undefined') return [...DEFAULT_ROLES]
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : [...DEFAULT_ROLES]
  }

  const roles = ref<string[]>(loadRoles())

  // Persist to localStorage on changes
  watch(
    roles,
    (newRoles) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRoles))
      }
    },
    { deep: true }
  )

  function addRole(role: string): void {
    const normalizedRole = role.toUpperCase().trim()
    if (normalizedRole && !roles.value.includes(normalizedRole)) {
      roles.value.push(normalizedRole)
    }
  }

  function removeRole(role: string): void {
    const index = roles.value.indexOf(role)
    if (index > -1 && !DEFAULT_ROLES.includes(role)) {
      roles.value.splice(index, 1)
    }
  }

  function isDefaultRole(role: string): boolean {
    return DEFAULT_ROLES.includes(role)
  }

  function resetRoles(): void {
    roles.value = [...DEFAULT_ROLES]
  }

  return {
    roles,
    addRole,
    removeRole,
    isDefaultRole,
    resetRoles,
  }
})
