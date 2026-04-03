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

    it('should cycle through all custom palette colors', () => {
      const store = useRolesStore()

      const colors: string[] = []
      // The custom palette has 12 colors
      for (let i = 0; i < 12; i++) {
        store.addRole(`custom_role_${i}`)
        colors.push(store.getRoleColor(`CUSTOM_ROLE_${i}`))
      }

      // All colors should be from the custom palette (not blue, green, orange, purple)
      for (const color of colors) {
        expect(['blue', 'green', 'orange', 'purple']).not.toContain(color)
      }
    })
  })

  describe('removeRole - color cleanup', () => {
    it('should remove color when removing custom role', () => {
      const store = useRolesStore()
      store.addRole('devops')
      const devopsColor = store.getRoleColor('DEVOPS')

      store.removeRole('DEVOPS')

      // Color should be gone — getRoleColor returns 'grey' for missing
      expect(store.getRoleColor('DEVOPS')).toBe('grey')
      // Color should no longer be in roleColors map
      expect(store.roleColors['DEVOPS']).toBeUndefined()
    })

    it('should not affect other roles when removing one', () => {
      const store = useRolesStore()
      store.addRole('devops')
      store.addRole('platform')

      const platformColor = store.getRoleColor('PLATFORM')

      store.removeRole('DEVOPS')

      expect(store.roles).toContain('PLATFORM')
      expect(store.getRoleColor('PLATFORM')).toBe(platformColor)
    })
  })

  describe('renameRole - edge cases', () => {
    it('should preserve color through rename', () => {
      const store = useRolesStore()
      store.addRole('devops')
      const originalColor = store.getRoleColor('DEVOPS')

      store.renameRole('DEVOPS', 'sre')

      expect(store.getRoleColor('SRE')).toBe(originalColor)
      expect(store.roleColors['DEVOPS']).toBeUndefined()
    })

    it('should not rename to whitespace-only name', () => {
      const store = useRolesStore()
      store.addRole('devops')

      const result = store.renameRole('DEVOPS', '   ')

      expect(result).toBe(false)
      expect(store.roles).toContain('DEVOPS')
    })

    it('should not rename non-existent role', () => {
      const store = useRolesStore()

      const result = store.renameRole('NONEXISTENT', 'SOMETHING')

      expect(result).toBe(false)
    })

    it('should normalize new name to uppercase', () => {
      const store = useRolesStore()
      store.addRole('devops')

      store.renameRole('DEVOPS', 'platform')

      expect(store.roles).toContain('PLATFORM')
      expect(store.roles).not.toContain('platform')
    })
  })

  describe('addRole - color assignment', () => {
    it('should assign a color from the custom palette', () => {
      const store = useRolesStore()
      store.addRole('devops')

      const color = store.roleColors['DEVOPS']
      expect(color).toBeDefined()
      // Should be a color from the custom palette
      const customPalette = [
        'teal', 'red', 'pink', 'indigo', 'cyan', 'lime',
        'amber', 'deep-orange', 'brown', 'blue-grey', 'light-blue', 'deep-purple',
      ]
      expect(customPalette).toContain(color)
    })

    it('should not overwrite manually set color when re-adding', () => {
      const store = useRolesStore()
      store.addRole('devops')
      store.updateRoleColor('DEVOPS', 'gold')

      // Trying to add same role again — should be no-op
      store.addRole('devops')

      expect(store.getRoleColor('DEVOPS')).toBe('gold')
    })
  })
})
