import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRolesStore } from '~/stores/roles'
import { DEFAULT_ROLES } from '~/types'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('rolesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
  })

  describe('initial state', () => {
    it('should start with default roles', () => {
      const store = useRolesStore()

      expect(store.roles).toEqual(DEFAULT_ROLES)
    })
  })

  describe('addRole', () => {
    it('should add a new role', () => {
      const store = useRolesStore()

      store.addRole('devops')

      expect(store.roles).toContain('DEVOPS')
    })

    it('should normalize role to uppercase', () => {
      const store = useRolesStore()

      store.addRole('  manager  ')

      expect(store.roles).toContain('MANAGER')
    })

    it('should not add duplicate roles', () => {
      const store = useRolesStore()
      const initialCount = store.roles.length

      store.addRole('BE')

      expect(store.roles.length).toBe(initialCount)
    })

    it('should not add empty roles', () => {
      const store = useRolesStore()
      const initialCount = store.roles.length

      store.addRole('')
      store.addRole('   ')

      expect(store.roles.length).toBe(initialCount)
    })
  })

  describe('removeRole', () => {
    it('should remove custom role', () => {
      const store = useRolesStore()
      store.addRole('devops')

      store.removeRole('DEVOPS')

      expect(store.roles).not.toContain('DEVOPS')
    })

    it('should not remove default roles', () => {
      const store = useRolesStore()

      store.removeRole('BE')

      expect(store.roles).toContain('BE')
    })
  })

  describe('isDefaultRole', () => {
    it('should return true for default roles', () => {
      const store = useRolesStore()

      expect(store.isDefaultRole('BE')).toBe(true)
      expect(store.isDefaultRole('FE')).toBe(true)
      expect(store.isDefaultRole('MOBILE')).toBe(true)
      expect(store.isDefaultRole('QA')).toBe(true)
    })

    it('should return false for custom roles', () => {
      const store = useRolesStore()

      expect(store.isDefaultRole('DEVOPS')).toBe(false)
    })
  })

  describe('resetRoles', () => {
    it('should reset to default roles', () => {
      const store = useRolesStore()
      store.addRole('devops')
      store.addRole('manager')

      store.resetRoles()

      expect(store.roles).toEqual(DEFAULT_ROLES)
    })

    it('should reset colors to defaults', () => {
      const store = useRolesStore()
      store.updateRoleColor('BE', 'red')
      store.addRole('devops')

      store.resetRoles()

      expect(store.getRoleColor('BE')).toBe('blue')
      expect(store.getRoleColor('FE')).toBe('green')
      expect(store.getRoleColor('DEVOPS')).toBe('grey') // removed role
    })
  })

  describe('getRoleColor', () => {
    it('should return default colors for built-in roles', () => {
      const store = useRolesStore()

      expect(store.getRoleColor('BE')).toBe('blue')
      expect(store.getRoleColor('FE')).toBe('green')
      expect(store.getRoleColor('MOBILE')).toBe('orange')
      expect(store.getRoleColor('QA')).toBe('purple')
    })

    it('should return grey for unknown roles', () => {
      const store = useRolesStore()

      expect(store.getRoleColor('UNKNOWN')).toBe('grey')
    })

    it('should auto-assign color when adding a new role', () => {
      const store = useRolesStore()

      store.addRole('devops')

      const color = store.getRoleColor('DEVOPS')
      expect(color).toBeTruthy()
      expect(color).not.toBe('grey')
    })
  })

  describe('updateRoleColor', () => {
    it('should update color for a role', () => {
      const store = useRolesStore()

      store.updateRoleColor('BE', 'red')

      expect(store.getRoleColor('BE')).toBe('red')
    })

    it('should not update color for a non-existent role', () => {
      const store = useRolesStore()

      store.updateRoleColor('NONEXISTENT', 'red')

      expect(store.getRoleColor('NONEXISTENT')).toBe('grey')
    })
  })

  describe('renameRole', () => {
    it('should rename a custom role', () => {
      const store = useRolesStore()
      store.addRole('devops')
      const originalColor = store.getRoleColor('DEVOPS')

      const result = store.renameRole('DEVOPS', 'PLATFORM')

      expect(result).toBe(true)
      expect(store.roles).toContain('PLATFORM')
      expect(store.roles).not.toContain('DEVOPS')
      expect(store.getRoleColor('PLATFORM')).toBe(originalColor)
    })

    it('should not rename default roles', () => {
      const store = useRolesStore()

      const result = store.renameRole('BE', 'BACKEND')

      expect(result).toBe(false)
      expect(store.roles).toContain('BE')
      expect(store.roles).not.toContain('BACKEND')
    })

    it('should not rename to an existing role name', () => {
      const store = useRolesStore()
      store.addRole('devops')

      const result = store.renameRole('DEVOPS', 'BE')

      expect(result).toBe(false)
      expect(store.roles).toContain('DEVOPS')
    })

    it('should not rename to empty string', () => {
      const store = useRolesStore()
      store.addRole('devops')

      const result = store.renameRole('DEVOPS', '')

      expect(result).toBe(false)
    })
  })

  describe('getNextAvailableColor', () => {
    it('should return colors not already in use', () => {
      const store = useRolesStore()

      // Default roles use blue, green, orange, purple
      const nextColor = store.getNextAvailableColor()
      expect(['blue', 'green', 'orange', 'purple']).not.toContain(nextColor)
    })

    it('should return different colors for successive additions', () => {
      const store = useRolesStore()

      store.addRole('role1')
      store.addRole('role2')

      const color1 = store.getRoleColor('ROLE1')
      const color2 = store.getRoleColor('ROLE2')
      expect(color1).not.toBe(color2)
    })
  })
})
