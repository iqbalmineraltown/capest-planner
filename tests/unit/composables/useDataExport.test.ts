import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDataExport } from '~/composables/useDataExport'
import { useMembersStore } from '~/stores/members'
import { useInitiativesStore } from '~/stores/initiatives'
import { useQuartersStore } from '~/stores/quarters'
import { useRolesStore } from '~/stores/roles'
import type { ExportData } from '~/composables/useDataExport'

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

// Mock Blob and URL.createObjectURL for export tests
globalThis.Blob = vi.fn().mockImplementation((parts: string[], options: any) => ({
  size: parts.join('').length,
  type: options?.type,
})) as any

globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
globalThis.URL.revokeObjectURL = vi.fn()

describe('useDataExport', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
  })

  describe('getExportPreview', () => {
    it('should return counts of all data', () => {
      const membersStore = useMembersStore()
      const initiativesStore = useInitiativesStore()
      const quartersStore = useQuartersStore()
      const rolesStore = useRolesStore()

      membersStore.addMember({ name: 'John', roles: ['BE'], quarterAvailability: { 'Q1-2025': 10 } })
      membersStore.addMember({ name: 'Jane', roles: ['FE'], quarterAvailability: { 'Q1-2025': 12 } })
      initiativesStore.addInitiative({
        name: 'Project A',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [{ role: 'BE', effort: 5 }],
      })

      const { getExportPreview } = useDataExport()
      const preview = getExportPreview()

      expect(preview.members).toBe(2)
      expect(preview.initiatives).toBe(1)
      expect(preview.quarters).toBe(quartersStore.quarters.length)
      expect(preview.roles).toBe(rolesStore.roles.length)
    })

    it('should return zeros for empty stores', () => {
      const { getExportPreview } = useDataExport()
      const preview = getExportPreview()

      expect(preview.members).toBe(0)
      expect(preview.initiatives).toBe(0)
    })
  })

  describe('importData - validation', () => {
    it('should reject file missing required "members" key', async () => {
      const { importData } = useDataExport()

      const badData = JSON.stringify({
        initiatives: [],
        quarters: [],
        roles: [],
      })
      const file = new File([badData], 'test.json', { type: 'application/json' })

      const result = await importData(file)

      expect(result.success).toBe(false)
      expect(result.message).toContain('missing required key "members"')
    })

    it('should reject file missing required "initiatives" key', async () => {
      const { importData } = useDataExport()

      const badData = JSON.stringify({
        members: [],
        quarters: [],
        roles: [],
      })
      const file = new File([badData], 'test.json', { type: 'application/json' })

      const result = await importData(file)

      expect(result.success).toBe(false)
      expect(result.message).toContain('missing required key "initiatives"')
    })

    it('should reject file missing required "quarters" key', async () => {
      const { importData } = useDataExport()

      const badData = JSON.stringify({
        members: [],
        initiatives: [],
        roles: [],
      })
      const file = new File([badData], 'test.json', { type: 'application/json' })

      const result = await importData(file)

      expect(result.success).toBe(false)
      expect(result.message).toContain('missing required key "quarters"')
    })

    it('should reject file missing required "roles" key', async () => {
      const { importData } = useDataExport()

      const badData = JSON.stringify({
        members: [],
        initiatives: [],
        quarters: [],
      })
      const file = new File([badData], 'test.json', { type: 'application/json' })

      const result = await importData(file)

      expect(result.success).toBe(false)
      expect(result.message).toContain('missing required key "roles"')
    })

    it('should reject file where members is not an array', async () => {
      const { importData } = useDataExport()

      const badData = JSON.stringify({
        members: 'not an array',
        initiatives: [],
        quarters: [],
        roles: [],
      })
      const file = new File([badData], 'test.json', { type: 'application/json' })

      const result = await importData(file)

      expect(result.success).toBe(false)
      expect(result.message).toContain('expected arrays')
    })

    it('should reject file where initiatives is not an array', async () => {
      const { importData } = useDataExport()

      const badData = JSON.stringify({
        members: [],
        initiatives: 42,
        quarters: [],
        roles: [],
      })
      const file = new File([badData], 'test.json', { type: 'application/json' })

      const result = await importData(file)

      expect(result.success).toBe(false)
      expect(result.message).toContain('expected arrays')
    })

    it('should reject file where quarters is not an array', async () => {
      const { importData } = useDataExport()

      const badData = JSON.stringify({
        members: [],
        initiatives: [],
        quarters: {},
        roles: [],
      })
      const file = new File([badData], 'test.json', { type: 'application/json' })

      const result = await importData(file)

      expect(result.success).toBe(false)
      expect(result.message).toContain('expected arrays')
    })

    it('should reject file where roles is not an array', async () => {
      const { importData } = useDataExport()

      const badData = JSON.stringify({
        members: [],
        initiatives: [],
        quarters: [],
        roles: null,
      })
      const file = new File([badData], 'test.json', { type: 'application/json' })

      const result = await importData(file)

      expect(result.success).toBe(false)
      expect(result.message).toContain('expected arrays')
    })

    it('should reject invalid JSON', async () => {
      const { importData } = useDataExport()

      const file = new File(['{not valid json}'], 'test.json', { type: 'application/json' })

      const result = await importData(file)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Failed to parse file')
    })
  })

  describe('importData - successful import', () => {
    it('should import valid data and populate stores', async () => {
      const membersStore = useMembersStore()
      const initiativesStore = useInitiativesStore()
      const quartersStore = useQuartersStore()
      const rolesStore = useRolesStore()

      // Pre-populate some data to ensure it gets replaced
      membersStore.addMember({ name: 'Old', roles: ['BE'], quarterAvailability: { 'Q1-2025': 5 } })

      const importPayload: ExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        members: [
          {
            id: 'member-1',
            name: 'Alice',
            roles: ['BE', 'FE'],
            quarterAvailability: { 'Q1-2025': 13 },
            assignedInitiatives: [],
          },
          {
            id: 'member-2',
            name: 'Bob',
            roles: ['QA'],
            quarterAvailability: { 'Q1-2025': 10 },
            assignedInitiatives: [],
          },
        ],
        initiatives: [
          {
            id: 'init-1',
            name: 'Project Alpha',
            description: 'Test project',
            quarter: 'Q1-2025',
            roleRequirements: [{ role: 'BE', effort: 8 }],
            assignments: [],
          },
        ],
        quarters: [
          {
            id: 'Q1-2025',
            label: '2025 Q1',
            totalWeeks: 13,
            startDate: '2025-01-01T00:00:00.000Z',
            endDate: '2025-03-31T00:00:00.000Z',
          },
        ],
        roles: ['BE', 'FE', 'QA', 'MOBILE'],
      }

      const { importData } = useDataExport()
      const file = new File([JSON.stringify(importPayload)], 'import.json', { type: 'application/json' })

      const result = await importData(file)

      expect(result.success).toBe(true)
      expect(result.message).toContain('2 members')
      expect(result.message).toContain('1 initiatives')
      expect(result.message).toContain('1 quarters')
      expect(result.message).toContain('4 roles')

      // Verify stores were populated
      expect(membersStore.members.length).toBe(2)
      expect(membersStore.members[0].name).toBe('Alice')
      expect(membersStore.members[1].name).toBe('Bob')

      expect(initiativesStore.initiatives.length).toBe(1)
      expect(initiativesStore.initiatives[0].name).toBe('Project Alpha')

      expect(quartersStore.quarters.length).toBe(1)
      expect(quartersStore.quarters[0].id).toBe('Q1-2025')
      // Date objects should be reconstructed
      expect(quartersStore.quarters[0].startDate).toBeInstanceOf(Date)
      expect(quartersStore.quarters[0].endDate).toBeInstanceOf(Date)

      expect(rolesStore.roles).toEqual(['BE', 'FE', 'QA', 'MOBILE'])
    })

    it('should replace existing data on import', async () => {
      const membersStore = useMembersStore()
      const initiativesStore = useInitiativesStore()

      // Pre-populate
      membersStore.addMember({ name: 'Old Member', roles: ['BE'], quarterAvailability: { 'Q1-2025': 5 } })
      initiativesStore.addInitiative({
        name: 'Old Initiative',
        description: '',
        quarter: 'Q1-2025',
        roleRequirements: [],
      })

      const importPayload: ExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        members: [
          {
            id: 'new-1',
            name: 'New Member',
            roles: ['FE'],
            quarterAvailability: { 'Q1-2025': 10 },
            assignedInitiatives: [],
          },
        ],
        initiatives: [],
        quarters: [
          {
            id: 'Q1-2025',
            label: '2025 Q1',
            totalWeeks: 13,
            startDate: '2025-01-01T00:00:00.000Z',
            endDate: '2025-03-31T00:00:00.000Z',
          },
        ],
        roles: ['BE'],
      }

      const { importData } = useDataExport()
      const file = new File([JSON.stringify(importPayload)], 'import.json', { type: 'application/json' })

      const result = await importData(file)

      expect(result.success).toBe(true)
      expect(membersStore.members.length).toBe(1)
      expect(membersStore.members[0].name).toBe('New Member')
      expect(initiativesStore.initiatives.length).toBe(0)
    })

    it('should import empty data cleanly', async () => {
      const importPayload: ExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        members: [],
        initiatives: [],
        quarters: [],
        roles: [],
      }

      const { importData } = useDataExport()
      const file = new File([JSON.stringify(importPayload)], 'empty.json', { type: 'application/json' })

      const result = await importData(file)

      expect(result.success).toBe(true)
      expect(result.message).toContain('0 members')
    })
  })
})
