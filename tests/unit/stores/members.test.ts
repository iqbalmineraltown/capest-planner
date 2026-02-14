import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMembersStore } from '~/stores/members'

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

describe('membersStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
  })

  describe('initial state', () => {
    it('should start with empty members', () => {
      const store = useMembersStore()

      expect(store.members).toEqual([])
      expect(store.memberCount).toBe(0)
    })
  })

  describe('addMember', () => {
    it('should add a new member with generated ID', () => {
      const store = useMembersStore()

      const member = store.addMember({
        name: 'John Doe',
        roles: ['BE', 'FE'],
        availability: 13,
      })

      expect(member.id).toBeDefined()
      expect(member.name).toBe('John Doe')
      expect(member.roles).toEqual(['BE', 'FE'])
      expect(member.availability).toBe(13)
      expect(member.assignedInitiatives).toEqual([])
      expect(store.memberCount).toBe(1)
    })

    it('should add multiple members', () => {
      const store = useMembersStore()

      store.addMember({ name: 'John', roles: ['BE'], availability: 10 })
      store.addMember({ name: 'Jane', roles: ['FE'], availability: 12 })

      expect(store.memberCount).toBe(2)
    })
  })

  describe('updateMember', () => {
    it('should update existing member', () => {
      const store = useMembersStore()
      const member = store.addMember({
        name: 'John Doe',
        roles: ['BE'],
        availability: 10,
      })

      const result = store.updateMember(member.id, {
        name: 'John Smith',
        availability: 13,
      })

      expect(result).toBe(true)
      expect(store.getMemberById(member.id)?.name).toBe('John Smith')
      expect(store.getMemberById(member.id)?.availability).toBe(13)
    })

    it('should return false for non-existent member', () => {
      const store = useMembersStore()

      const result = store.updateMember('non-existent', { name: 'Test' })

      expect(result).toBe(false)
    })
  })

  describe('removeMember', () => {
    it('should remove existing member', () => {
      const store = useMembersStore()
      const member = store.addMember({
        name: 'John Doe',
        roles: ['BE'],
        availability: 10,
      })

      const result = store.removeMember(member.id)

      expect(result).toBe(true)
      expect(store.memberCount).toBe(0)
    })

    it('should return false for non-existent member', () => {
      const store = useMembersStore()

      const result = store.removeMember('non-existent')

      expect(result).toBe(false)
    })
  })

  describe('getMembersByRole', () => {
    it('should filter members by role', () => {
      const store = useMembersStore()
      store.addMember({ name: 'John', roles: ['BE', 'FE'], availability: 10 })
      store.addMember({ name: 'Jane', roles: ['QA'], availability: 10 })
      store.addMember({ name: 'Bob', roles: ['BE'], availability: 10 })

      const beMembers = store.getMembersByRole('BE')

      expect(beMembers).toHaveLength(2)
      expect(beMembers.map((m) => m.name)).toContain('John')
      expect(beMembers.map((m) => m.name)).toContain('Bob')
    })
  })

  describe('initiative assignments', () => {
    it('should assign member to initiative', () => {
      const store = useMembersStore()
      const member = store.addMember({
        name: 'John Doe',
        roles: ['BE'],
        availability: 10,
      })

      store.assignToInitiative(member.id, 'initiative-1')

      expect(member.assignedInitiatives).toContain('initiative-1')
    })

    it('should not duplicate initiative assignments', () => {
      const store = useMembersStore()
      const member = store.addMember({
        name: 'John Doe',
        roles: ['BE'],
        availability: 10,
      })

      store.assignToInitiative(member.id, 'initiative-1')
      store.assignToInitiative(member.id, 'initiative-1')

      expect(member.assignedInitiatives).toHaveLength(1)
    })

    it('should unassign member from initiative', () => {
      const store = useMembersStore()
      const member = store.addMember({
        name: 'John Doe',
        roles: ['BE'],
        availability: 10,
      })

      store.assignToInitiative(member.id, 'initiative-1')
      store.unassignFromInitiative(member.id, 'initiative-1')

      expect(member.assignedInitiatives).not.toContain('initiative-1')
    })
  })

  describe('clearAll', () => {
    it('should remove all members', () => {
      const store = useMembersStore()
      store.addMember({ name: 'John', roles: ['BE'], availability: 10 })
      store.addMember({ name: 'Jane', roles: ['FE'], availability: 10 })

      store.clearAll()

      expect(store.memberCount).toBe(0)
    })
  })
})
