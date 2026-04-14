import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useInitiativesStore } from '~/stores/initiatives'
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
      const { [key]: _, ...remaining } = store
      store = remaining
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('initiativesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
  })

  describe('initial state', () => {
    it('should start with empty initiatives', () => {
      const store = useInitiativesStore()

      expect(store.initiatives).toEqual([])
      expect(store.initiativeCount).toBe(0)
    })
  })

  describe('addInitiative', () => {
    it('should create initiative with generated ID and empty assignments', () => {
      const store = useInitiativesStore()

      const initiative = store.addInitiative({
        name: 'Platform Migration',
        description: 'Migrate legacy system to new platform',
        quarter: 'Q1-2025',
        roleRequirements: [
          { role: 'BE', effort: 5 },
          { role: 'FE', effort: 3 },
        ],
      })

      expect(initiative.id).toBeDefined()
      expect(initiative.name).toBe('Platform Migration')
      expect(initiative.description).toBe('Migrate legacy system to new platform')
      expect(initiative.quarter).toBe('Q1-2025')
      expect(initiative.assignments).toEqual([])
      expect(initiative.carriesOverTo).toBeUndefined()
      expect(initiative.roleRequirements).toHaveLength(2)
      expect(store.initiativeCount).toBe(1)
    })

    it('should add multiple initiatives', () => {
      const store = useInitiativesStore()

      store.addInitiative({
        name: 'Initiative A',
        description: 'Description A',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })
      store.addInitiative({
        name: 'Initiative B',
        description: 'Description B',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })
      store.addInitiative({
        name: 'Initiative C',
        description: 'Description C',
        quarter: 'Q2-2025',
        roleRequirements: [],
      })

      expect(store.initiativeCount).toBe(3)
    })

    it('should generate unique IDs for each initiative', () => {
      const store = useInitiativesStore()

      const init1 = store.addInitiative({
        name: 'Initiative 1',
        description: 'Desc 1',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })
      const init2 = store.addInitiative({
        name: 'Initiative 2',
        description: 'Desc 2',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      expect(init1.id).not.toBe(init2.id)
    })
  })

  describe('updateInitiative', () => {
    it('should update existing initiative fields', () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'Original Name',
        description: 'Original description',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      const result = store.updateInitiative(initiative.id, {
        name: 'Updated Name',
        description: 'Updated description',
      })

      expect(result).toBe(true)
      const updated = store.getInitiativeById(initiative.id)
      expect(updated?.name).toBe('Updated Name')
      expect(updated?.description).toBe('Updated description')
      expect(updated?.quarter).toBe('Q1-2025')
    })

    it('should update quarter assignment', () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'Test Initiative',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      store.updateInitiative(initiative.id, { quarter: 'Q2-2025' })

      expect(store.getInitiativeById(initiative.id)?.quarter).toBe('Q2-2025')
    })

    it('should update role requirements', () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'Test Initiative',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [{ role: 'BE', effort: 5 }],
      })

      store.updateInitiative(initiative.id, {
        roleRequirements: [
          { role: 'BE', effort: 3 },
          { role: 'QA', effort: 2 },
        ],
      })

      const updated = store.getInitiativeById(initiative.id)
      expect(updated?.roleRequirements).toHaveLength(2)
      expect(updated?.roleRequirements[0].effort).toBe(3)
    })

    it('should return false for non-existent initiative', () => {
      const store = useInitiativesStore()

      const result = store.updateInitiative('non-existent', { name: 'Test' })

      expect(result).toBe(false)
    })
  })

  describe('removeInitiative', () => {
    it('should remove existing initiative', () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'To Remove',
        description: 'Will be removed',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      const result = store.removeInitiative(initiative.id)

      expect(result).toBe(true)
      expect(store.initiativeCount).toBe(0)
      expect(store.getInitiativeById(initiative.id)).toBeUndefined()
    })

    it('should return false for non-existent initiative', () => {
      const store = useInitiativesStore()

      const result = store.removeInitiative('non-existent')

      expect(result).toBe(false)
    })

    it('should cascade and unassign initiative from all members', () => {
      const initiativesStore = useInitiativesStore()
      const membersStore = useMembersStore()

      const member = membersStore.addMember({
        name: 'John Doe',
        roles: ['BE'],
        availability: 10,
      })
      const initiative = initiativesStore.addInitiative({
        name: 'Test Initiative',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      // Manually assign member to initiative (simulating what board would do)
      member.assignedInitiatives.push(initiative.id)
      expect(member.assignedInitiatives).toContain(initiative.id)

      // Remove initiative should cascade
      initiativesStore.removeInitiative(initiative.id)

      expect(member.assignedInitiatives).not.toContain(initiative.id)
    })

    it('should remove initiative from multiple members', () => {
      const initiativesStore = useInitiativesStore()
      const membersStore = useMembersStore()

      const member1 = membersStore.addMember({
        name: 'Alice',
        roles: ['BE'],
        availability: 10,
      })
      const member2 = membersStore.addMember({
        name: 'Bob',
        roles: ['FE'],
        availability: 10,
      })
      const initiative = initiativesStore.addInitiative({
        name: 'Shared Initiative',
        description: 'Shared',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      member1.assignedInitiatives.push(initiative.id)
      member2.assignedInitiatives.push(initiative.id)

      initiativesStore.removeInitiative(initiative.id)

      expect(member1.assignedInitiatives).not.toContain(initiative.id)
      expect(member2.assignedInitiatives).not.toContain(initiative.id)
    })
  })

  describe('addRoleRequirement', () => {
    it('should add a role requirement to an initiative', () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'Test Initiative',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      const result = store.addRoleRequirement(initiative.id, {
        role: 'BE',
        effort: 5,
      })

      expect(result).toBe(true)
      const updated = store.getInitiativeById(initiative.id)
      expect(updated?.roleRequirements).toHaveLength(1)
      expect(updated?.roleRequirements[0]).toEqual({ role: 'BE', effort: 5 })
    })

    it('should add multiple role requirements', () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'Test Initiative',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [{ role: 'BE', effort: 3 }],
      })

      store.addRoleRequirement(initiative.id, { role: 'FE', effort: 4 })
      store.addRoleRequirement(initiative.id, { role: 'QA', effort: 2 })

      const updated = store.getInitiativeById(initiative.id)
      expect(updated?.roleRequirements).toHaveLength(3)
    })

    it('should return false for non-existent initiative', () => {
      const store = useInitiativesStore()

      const result = store.addRoleRequirement('non-existent', {
        role: 'BE',
        effort: 5,
      })

      expect(result).toBe(false)
    })
  })

  describe('removeRoleRequirement', () => {
    it('should remove a role requirement by index', () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'Test Initiative',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [
          { role: 'BE', effort: 5 },
          { role: 'FE', effort: 3 },
          { role: 'QA', effort: 2 },
        ],
      })

      const result = store.removeRoleRequirement(initiative.id, 1)

      expect(result).toBe(true)
      const updated = store.getInitiativeById(initiative.id)
      expect(updated?.roleRequirements).toHaveLength(2)
      expect(updated?.roleRequirements.map((r) => r.role)).toEqual(['BE', 'QA'])
    })

    it('should return false for non-existent initiative', () => {
      const store = useInitiativesStore()

      const result = store.removeRoleRequirement('non-existent', 0)

      expect(result).toBe(false)
    })

    it('should return false for out-of-bounds index', () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'Test Initiative',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [{ role: 'BE', effort: 5 }],
      })

      expect(store.removeRoleRequirement(initiative.id, 5)).toBe(false)
      expect(store.removeRoleRequirement(initiative.id, -1)).toBe(false)
    })
  })

  describe('addAssignment', () => {
    it('should add an assignment to an initiative', () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'Test Initiative',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      const assignment = {
        memberId: 'member-1',
        role: 'BE' as const,
        weeksAllocated: 4,
        startWeek: 1,
        isParallel: false,
      }

      const result = store.addAssignment(initiative.id, assignment)

      expect(result).toBe(true)
      const updated = store.getInitiativeById(initiative.id)
      expect(updated?.assignments).toHaveLength(1)
      expect(updated?.assignments[0]).toEqual(assignment)
    })

    it('should add multiple assignments', () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'Test Initiative',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      store.addAssignment(initiative.id, {
        memberId: 'member-1',
        role: 'BE',
        weeksAllocated: 4,
        startWeek: 1,
        isParallel: false,
      })
      store.addAssignment(initiative.id, {
        memberId: 'member-2',
        role: 'FE',
        weeksAllocated: 3,
        startWeek: 5,
        isParallel: true,
      })

      const updated = store.getInitiativeById(initiative.id)
      expect(updated?.assignments).toHaveLength(2)
    })

    it('should return false for non-existent initiative', () => {
      const store = useInitiativesStore()

      const result = store.addAssignment('non-existent', {
        memberId: 'member-1',
        role: 'BE',
        weeksAllocated: 4,
        startWeek: 1,
        isParallel: false,
      })

      expect(result).toBe(false)
    })
  })

  describe('updateAssignment', () => {
    it('should update an existing assignment', () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'Test Initiative',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      store.addAssignment(initiative.id, {
        memberId: 'member-1',
        role: 'BE',
        weeksAllocated: 4,
        startWeek: 1,
        isParallel: false,
      })

      const result = store.updateAssignment(initiative.id, 0, {
        weeksAllocated: 6,
        startWeek: 2,
      })

      expect(result).toBe(true)
      const updated = store.getInitiativeById(initiative.id)
      expect(updated?.assignments[0].weeksAllocated).toBe(6)
      expect(updated?.assignments[0].startWeek).toBe(2)
      expect(updated?.assignments[0].memberId).toBe('member-1')
    })

    it('should preserve unchanged fields', () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'Test Initiative',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      store.addAssignment(initiative.id, {
        memberId: 'member-1',
        role: 'BE',
        weeksAllocated: 4,
        startWeek: 1,
        isParallel: false,
      })

      store.updateAssignment(initiative.id, 0, { isParallel: true })

      const updated = store.getInitiativeById(initiative.id)
      expect(updated?.assignments[0].isParallel).toBe(true)
      expect(updated?.assignments[0].weeksAllocated).toBe(4)
      expect(updated?.assignments[0].startWeek).toBe(1)
    })

    it('should return false for non-existent initiative', () => {
      const store = useInitiativesStore()

      const result = store.updateAssignment('non-existent', 0, {
        weeksAllocated: 5,
      })

      expect(result).toBe(false)
    })

    it('should return false for out-of-bounds member index', () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'Test Initiative',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      expect(store.updateAssignment(initiative.id, 5, { weeksAllocated: 5 })).toBe(false)
      expect(store.updateAssignment(initiative.id, -1, { weeksAllocated: 5 })).toBe(false)
    })
  })

  describe('removeAssignment', () => {
    it('should remove an assignment by index', () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'Test Initiative',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      store.addAssignment(initiative.id, {
        memberId: 'member-1',
        role: 'BE',
        weeksAllocated: 4,
        startWeek: 1,
        isParallel: false,
      })
      store.addAssignment(initiative.id, {
        memberId: 'member-2',
        role: 'FE',
        weeksAllocated: 3,
        startWeek: 5,
        isParallel: true,
      })

      const result = store.removeAssignment(initiative.id, 0)

      expect(result).toBe(true)
      const updated = store.getInitiativeById(initiative.id)
      expect(updated?.assignments).toHaveLength(1)
      expect(updated?.assignments[0].memberId).toBe('member-2')
    })

    it('should return false for non-existent initiative', () => {
      const store = useInitiativesStore()

      const result = store.removeAssignment('non-existent', 0)

      expect(result).toBe(false)
    })

    it('should return false for out-of-bounds member index', () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'Test Initiative',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      store.addAssignment(initiative.id, {
        memberId: 'member-1',
        role: 'BE',
        weeksAllocated: 4,
        startWeek: 1,
        isParallel: false,
      })

      expect(store.removeAssignment(initiative.id, 5)).toBe(false)
      expect(store.removeAssignment(initiative.id, -1)).toBe(false)
    })
  })

  describe('setCarryOver', () => {
    it('should set carry-over quarter for an initiative', () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'Test Initiative',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      const result = store.setCarryOver(initiative.id, 'Q2-2025')

      expect(result).toBe(true)
      expect(store.getInitiativeById(initiative.id)?.carriesOverTo).toBe('Q2-2025')
    })

    it('should clear carry-over when set to undefined', () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'Test Initiative',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      store.setCarryOver(initiative.id, 'Q2-2025')
      store.setCarryOver(initiative.id, undefined)

      expect(store.getInitiativeById(initiative.id)?.carriesOverTo).toBeUndefined()
    })

    it('should return false for non-existent initiative', () => {
      const store = useInitiativesStore()

      const result = store.setCarryOver('non-existent', 'Q2-2025')

      expect(result).toBe(false)
    })
  })

  describe('clearAll', () => {
    it('should remove all initiatives', () => {
      const store = useInitiativesStore()

      store.addInitiative({
        name: 'Initiative A',
        description: 'Desc A',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })
      store.addInitiative({
        name: 'Initiative B',
        description: 'Desc B',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })
      store.addInitiative({
        name: 'Initiative C',
        description: 'Desc C',
        quarter: 'Q2-2025',
        roleRequirements: [],
      })

      store.clearAll()

      expect(store.initiativeCount).toBe(0)
      expect(store.initiatives).toEqual([])
    })
  })

  describe('getInitiativeById', () => {
    it('should return initiative by ID', () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'Target Initiative',
        description: 'Find me',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      const found = store.getInitiativeById(initiative.id)

      expect(found).toBeDefined()
      expect(found?.name).toBe('Target Initiative')
      expect(found?.id).toBe(initiative.id)
    })

    it('should return undefined for non-existent ID', () => {
      const store = useInitiativesStore()

      const found = store.getInitiativeById('non-existent')

      expect(found).toBeUndefined()
    })
  })

  describe('getInitiativesByQuarter', () => {
    it('should filter initiatives by quarter ID', () => {
      const store = useInitiativesStore()

      store.addInitiative({
        name: 'Q1 Initiative A',
        description: 'A',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })
      store.addInitiative({
        name: 'Q1 Initiative B',
        description: 'B',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })
      store.addInitiative({
        name: 'Q2 Initiative',
        description: 'C',
        quarter: 'Q2-2025',
        roleRequirements: [],
      })

      const q1Initiatives = store.getInitiativesByQuarter('Q1-2025')

      expect(q1Initiatives).toHaveLength(2)
      expect(q1Initiatives.map((i) => i.name)).toContain('Q1 Initiative A')
      expect(q1Initiatives.map((i) => i.name)).toContain('Q1 Initiative B')
    })

    it('should return empty array for quarter with no initiatives', () => {
      const store = useInitiativesStore()

      store.addInitiative({
        name: 'Q1 Initiative',
        description: 'A',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      const q3Initiatives = store.getInitiativesByQuarter('Q3-2025')

      expect(q3Initiatives).toEqual([])
    })
  })

  describe('getInitiativesForMember', () => {
    it('should return initiatives where member is assigned', () => {
      const store = useInitiativesStore()

      const init1 = store.addInitiative({
        name: 'Initiative A',
        description: 'A',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })
      const init2 = store.addInitiative({
        name: 'Initiative B',
        description: 'B',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })
      store.addInitiative({
        name: 'Initiative C',
        description: 'C',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      store.addAssignment(init1.id, {
        memberId: 'member-1',
        role: 'BE',
        weeksAllocated: 4,
        startWeek: 1,
        isParallel: false,
      })
      store.addAssignment(init2.id, {
        memberId: 'member-1',
        role: 'FE',
        weeksAllocated: 3,
        startWeek: 5,
        isParallel: true,
      })

      const memberInitiatives = store.getInitiativesForMember('member-1')

      expect(memberInitiatives).toHaveLength(2)
      expect(memberInitiatives.map((i) => i.name)).toContain('Initiative A')
      expect(memberInitiatives.map((i) => i.name)).toContain('Initiative B')
    })

    it('should return empty array for member with no assignments', () => {
      const store = useInitiativesStore()

      store.addInitiative({
        name: 'Initiative A',
        description: 'A',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      const memberInitiatives = store.getInitiativesForMember('unassigned-member')

      expect(memberInitiatives).toEqual([])
    })

    it('should not include initiatives where member is not assigned', () => {
      const store = useInitiativesStore()

      const init1 = store.addInitiative({
        name: 'Initiative A',
        description: 'A',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })
      const init2 = store.addInitiative({
        name: 'Initiative B',
        description: 'B',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      store.addAssignment(init1.id, {
        memberId: 'member-1',
        role: 'BE',
        weeksAllocated: 4,
        startWeek: 1,
        isParallel: false,
      })
      store.addAssignment(init2.id, {
        memberId: 'member-2',
        role: 'FE',
        weeksAllocated: 3,
        startWeek: 5,
        isParallel: true,
      })

      const member1Initiatives = store.getInitiativesForMember('member-1')

      expect(member1Initiatives).toHaveLength(1)
      expect(member1Initiatives[0].name).toBe('Initiative A')
    })
  })

  describe('localStorage persistence', () => {
    it('should save initiatives to localStorage on add', async () => {
      const store = useInitiativesStore()

      store.addInitiative({
        name: 'Persisted Initiative',
        description: 'Should be saved',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      // Allow watch to flush
      await new Promise((resolve) => setTimeout(resolve, 0))

      const savedData = JSON.parse(localStorage.getItem('capest-initiatives')!)
      expect(savedData).toHaveLength(1)
      expect(savedData[0].name).toBe('Persisted Initiative')
    })

    it('should save initiatives to localStorage on update', async () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'Original',
        description: 'Original',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      store.updateInitiative(initiative.id, { name: 'Updated' })

      await new Promise((resolve) => setTimeout(resolve, 0))

      const savedData = JSON.parse(localStorage.getItem('capest-initiatives')!)
      expect(savedData[0].name).toBe('Updated')
    })

    it('should save initiatives to localStorage on remove', async () => {
      const store = useInitiativesStore()
      const initiative = store.addInitiative({
        name: 'To Remove',
        description: 'Will be removed',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      store.removeInitiative(initiative.id)

      await new Promise((resolve) => setTimeout(resolve, 0))

      const savedData = JSON.parse(localStorage.getItem('capest-initiatives')!)
      expect(savedData).toHaveLength(0)
    })

    it('should load initiatives from localStorage on initialization', () => {
      const storedInitiatives = [
        {
          id: 'init-1',
          name: 'Stored Initiative',
          description: 'Loaded from storage',
          quarter: 'Q1-2025',
          roleRequirements: [{ role: 'BE', effort: 5 }],
          assignments: [],
          carriesOverTo: undefined,
        },
      ]

      localStorage.setItem('capest-initiatives', JSON.stringify(storedInitiatives))

      const store = useInitiativesStore()

      expect(store.initiativeCount).toBe(1)
      expect(store.getInitiativeById('init-1')?.name).toBe('Stored Initiative')
    })

    it('should initialize with empty array when no localStorage data', () => {
      const store = useInitiativesStore()

      expect(store.initiatives).toEqual([])
      expect(store.initiativeCount).toBe(0)
    })

    it('should clear localStorage data when clearAll is called', async () => {
      const store = useInitiativesStore()

      store.addInitiative({
        name: 'Initiative A',
        description: 'A',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      store.clearAll()

      await new Promise((resolve) => setTimeout(resolve, 0))

      const savedData = JSON.parse(localStorage.getItem('capest-initiatives')!)
      expect(savedData).toEqual([])
    })
  })
})
