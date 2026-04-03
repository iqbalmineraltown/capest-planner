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
        quarterAvailability: { 'Q1-2025': 13 },
      })

      expect(member.id).toBeDefined()
      expect(member.name).toBe('John Doe')
      expect(member.roles).toEqual(['BE', 'FE'])
      expect(member.quarterAvailability).toEqual({ 'Q1-2025': 13 })
      expect(member.assignedInitiatives).toEqual([])
      expect(store.memberCount).toBe(1)
    })

    it('should add multiple members', () => {
      const store = useMembersStore()

      store.addMember({ name: 'John', roles: ['BE'], quarterAvailability: { 'Q1-2025': 10 } })
      store.addMember({ name: 'Jane', roles: ['FE'], quarterAvailability: { 'Q1-2025': 12 } })

      expect(store.memberCount).toBe(2)
    })
  })

  describe('updateMember', () => {
    it('should update existing member', () => {
      const store = useMembersStore()
      const member = store.addMember({
        name: 'John Doe',
        roles: ['BE'],
        quarterAvailability: { 'Q1-2025': 10 },
      })

      const result = store.updateMember(member.id, {
        name: 'John Smith',
        quarterAvailability: { 'Q1-2025': 13, 'Q2-2025': 10 },
      })

      expect(result).toBe(true)
      expect(store.getMemberById(member.id)?.name).toBe('John Smith')
      expect(store.getMemberById(member.id)?.quarterAvailability).toEqual({ 'Q1-2025': 13, 'Q2-2025': 10 })
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
        quarterAvailability: { 'Q1-2025': 10 },
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
      store.addMember({ name: 'John', roles: ['BE', 'FE'], quarterAvailability: { 'Q1-2025': 10 } })
      store.addMember({ name: 'Jane', roles: ['QA'], quarterAvailability: { 'Q1-2025': 10 } })
      store.addMember({ name: 'Bob', roles: ['BE'], quarterAvailability: { 'Q1-2025': 10 } })

      const beMembers = store.getMembersByRole('BE')

      expect(beMembers).toHaveLength(2)
      expect(beMembers.map((m) => m.name)).toContain('John')
      expect(beMembers.map((m) => m.name)).toContain('Bob')
    })
  })

  describe('getMembersForQuarter', () => {
    it('should filter members by quarter availability', () => {
      const store = useMembersStore()
      store.addMember({ name: 'John', roles: ['BE'], quarterAvailability: { 'Q1-2025': 10, 'Q2-2025': 8 } })
      store.addMember({ name: 'Jane', roles: ['QA'], quarterAvailability: { 'Q2-2025': 10 } }) // Only Q2
      store.addMember({ name: 'Bob', roles: ['BE'], quarterAvailability: { 'Q1-2025': 12 } })

      const q1Members = store.getMembersForQuarter('Q1-2025')
      const q2Members = store.getMembersForQuarter('Q2-2025')

      expect(q1Members).toHaveLength(2)
      expect(q1Members.map((m) => m.name)).toContain('John')
      expect(q1Members.map((m) => m.name)).toContain('Bob')

      expect(q2Members).toHaveLength(2)
      expect(q2Members.map((m) => m.name)).toContain('John')
      expect(q2Members.map((m) => m.name)).toContain('Jane')
    })

    it('should exclude members with zero availability', () => {
      const store = useMembersStore()
      store.addMember({ name: 'John', roles: ['BE'], quarterAvailability: { 'Q1-2025': 10 } })
      store.addMember({ name: 'Jane', roles: ['QA'], quarterAvailability: { 'Q1-2025': 0 } })

      const q1Members = store.getMembersForQuarter('Q1-2025')

      expect(q1Members).toHaveLength(1)
      expect(q1Members[0].name).toBe('John')
    })
  })

  describe('updateQuarterAvailability', () => {
    it('should update availability for a specific quarter', () => {
      const store = useMembersStore()
      const member = store.addMember({
        name: 'John Doe',
        roles: ['BE'],
        quarterAvailability: { 'Q1-2025': 10 },
      })

      const result = store.updateQuarterAvailability(member.id, 'Q1-2025', 13)

      expect(result).toBe(true)
      expect(member.quarterAvailability['Q1-2025']).toBe(13)
    })

    it('should add availability for a new quarter', () => {
      const store = useMembersStore()
      const member = store.addMember({
        name: 'John Doe',
        roles: ['BE'],
        quarterAvailability: { 'Q1-2025': 10 },
      })

      const result = store.updateQuarterAvailability(member.id, 'Q2-2025', 8)

      expect(result).toBe(true)
      expect(member.quarterAvailability['Q2-2025']).toBe(8)
      expect(member.quarterAvailability['Q1-2025']).toBe(10)
    })

    it('should return false for non-existent member', () => {
      const store = useMembersStore()

      const result = store.updateQuarterAvailability('non-existent', 'Q1-2025', 10)

      expect(result).toBe(false)
    })
  })

  describe('getQuarterAvailability', () => {
    it('should return availability for a specific quarter', () => {
      const store = useMembersStore()
      const member = store.addMember({
        name: 'John Doe',
        roles: ['BE'],
        quarterAvailability: { 'Q1-2025': 10, 'Q2-2025': 8 },
      })

      expect(store.getQuarterAvailability(member.id, 'Q1-2025')).toBe(10)
      expect(store.getQuarterAvailability(member.id, 'Q2-2025')).toBe(8)
    })

    it('should return 0 for unconfigured quarter', () => {
      const store = useMembersStore()
      const member = store.addMember({
        name: 'John Doe',
        roles: ['BE'],
        quarterAvailability: { 'Q1-2025': 10 },
      })

      expect(store.getQuarterAvailability(member.id, 'Q3-2025')).toBe(0)
    })
  })

  describe('initiative assignments', () => {
    it('should assign member to initiative', () => {
      const store = useMembersStore()
      const member = store.addMember({
        name: 'John Doe',
        roles: ['BE'],
        quarterAvailability: { 'Q1-2025': 10 },
      })

      store.assignToInitiative(member.id, 'initiative-1')

      expect(member.assignedInitiatives).toContain('initiative-1')
    })

    it('should not duplicate initiative assignments', () => {
      const store = useMembersStore()
      const member = store.addMember({
        name: 'John Doe',
        roles: ['BE'],
        quarterAvailability: { 'Q1-2025': 10 },
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
        quarterAvailability: { 'Q1-2025': 10 },
      })

      store.assignToInitiative(member.id, 'initiative-1')
      store.unassignFromInitiative(member.id, 'initiative-1')

      expect(member.assignedInitiatives).not.toContain('initiative-1')
    })
  })

  describe('clearAll', () => {
    it('should remove all members', () => {
      const store = useMembersStore()
      store.addMember({ name: 'John', roles: ['BE'], quarterAvailability: { 'Q1-2025': 10 } })
      store.addMember({ name: 'Jane', roles: ['FE'], quarterAvailability: { 'Q1-2025': 10 } })

      store.clearAll()

      expect(store.memberCount).toBe(0)
    })
  })
})
