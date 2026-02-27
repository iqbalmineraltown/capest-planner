import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { DEFAULT_ROLES } from '~/types'

const STORAGE_KEY = 'capest-roles'
const COLORS_STORAGE_KEY = 'capest-role-colors'

/** Default colors for built-in roles */
const DEFAULT_ROLE_COLORS: Record<string, string> = {
  BE: 'blue',
  FE: 'green',
  MOBILE: 'orange',
  QA: 'purple',
}

/**
 * Curated color palette for custom roles.
 * Intentionally avoids the 4 default colors (blue, green, orange, purple).
 */
const CUSTOM_ROLE_PALETTE = [
  'teal', 'red', 'pink', 'indigo', 'cyan', 'lime',
  'amber', 'deep-orange', 'brown', 'blue-grey', 'light-blue', 'deep-purple',
]

export const useRolesStore = defineStore('roles', () => {
  // Load from localStorage on initialization
  const loadRoles = (): string[] => {
    if (typeof window === 'undefined') return [...DEFAULT_ROLES]
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : [...DEFAULT_ROLES]
  }

  const loadRoleColors = (): Record<string, string> => {
    if (typeof window === 'undefined') return { ...DEFAULT_ROLE_COLORS }
    const stored = localStorage.getItem(COLORS_STORAGE_KEY)
    return stored ? { ...DEFAULT_ROLE_COLORS, ...JSON.parse(stored) } : { ...DEFAULT_ROLE_COLORS }
  }

  const roles = ref<string[]>(loadRoles())
  const roleColors = ref<Record<string, string>>(loadRoleColors())

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

  watch(
    roleColors,
    (newColors) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(COLORS_STORAGE_KEY, JSON.stringify(newColors))
      }
    },
    { deep: true }
  )

  /**
   * Get next available color from the curated palette.
   * Skips colors already assigned to existing roles.
   */
  function getNextAvailableColor(): string {
    const usedColors = new Set(Object.values(roleColors.value))
    for (const color of CUSTOM_ROLE_PALETTE) {
      if (!usedColors.has(color)) return color
    }
    // All palette colors used — cycle back from the start
    const customRoleCount = roles.value.filter(r => !DEFAULT_ROLES.includes(r)).length
    return CUSTOM_ROLE_PALETTE[customRoleCount % CUSTOM_ROLE_PALETTE.length]
  }

  function getRoleColor(role: string): string {
    return roleColors.value[role] || 'grey'
  }

  function addRole(role: string): void {
    const normalizedRole = role.toUpperCase().trim()
    if (normalizedRole && !roles.value.includes(normalizedRole)) {
      roles.value.push(normalizedRole)
      // Auto-assign color if not already set
      if (!roleColors.value[normalizedRole]) {
        roleColors.value[normalizedRole] = getNextAvailableColor()
      }
    }
  }

  function removeRole(role: string): void {
    const index = roles.value.indexOf(role)
    if (index > -1 && !DEFAULT_ROLES.includes(role)) {
      roles.value.splice(index, 1)
      delete roleColors.value[role]
    }
  }

  function renameRole(oldName: string, newName: string): boolean {
    if (DEFAULT_ROLES.includes(oldName)) return false // Cannot rename default roles
    const normalized = newName.toUpperCase().trim()
    if (!normalized || roles.value.includes(normalized)) return false

    const index = roles.value.indexOf(oldName)
    if (index === -1) return false

    // Preserve color
    const color = roleColors.value[oldName]
    roles.value.splice(index, 1, normalized)
    delete roleColors.value[oldName]
    roleColors.value[normalized] = color

    return true
  }

  function updateRoleColor(role: string, color: string): void {
    if (roles.value.includes(role)) {
      roleColors.value[role] = color
    }
  }

  function isDefaultRole(role: string): boolean {
    return DEFAULT_ROLES.includes(role)
  }

  function resetRoles(): void {
    roles.value = [...DEFAULT_ROLES]
    roleColors.value = { ...DEFAULT_ROLE_COLORS }
  }

  return {
    roles,
    roleColors,
    addRole,
    removeRole,
    renameRole,
    updateRoleColor,
    getRoleColor,
    getNextAvailableColor,
    isDefaultRole,
    resetRoles,
  }
})
