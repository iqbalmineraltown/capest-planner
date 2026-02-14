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
  })
})
