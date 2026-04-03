import { useMembersStore } from '~/stores/members'
import { useInitiativesStore } from '~/stores/initiatives'
import { useQuartersStore } from '~/stores/quarters'
import { useRolesStore } from '~/stores/roles'
import type { TeamMember, Initiative, QuarterConfig } from '~/types'

export interface ExportData {
  version: 1
  exportedAt: string
  members: TeamMember[]
  initiatives: Initiative[]
  quarters: QuarterConfig[]
  roles: string[]
}

export type ExportCollection = 'members' | 'initiatives' | 'quarters' | 'roles' | 'all'

export interface ImportResult {
  success: boolean
  message: string
}

export interface ExportPreview {
  members: number
  initiatives: number
  quarters: number
  roles: number
}

export interface FilePreview {
  fileName: string
  fileSize: string
  collection: ExportCollection
  preview: ExportPreview
}

export type ImportMode = 'replace' | 'merge'

const REQUIRED_KEYS: (keyof Pick<ExportData, 'members' | 'initiatives' | 'quarters' | 'roles'>)[] = [
  'members',
  'initiatives',
  'quarters',
  'roles',
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function useDataExport() {
  const membersStore = useMembersStore()
  const initiativesStore = useInitiativesStore()
  const quartersStore = useQuartersStore()
  const rolesStore = useRolesStore()

  function getExportPreview(): ExportPreview {
    return {
      members: membersStore.members.length,
      initiatives: initiativesStore.initiatives.length,
      quarters: quartersStore.quarters.length,
      roles: rolesStore.roles.length,
    }
  }

  /**
   * Read a file and return a preview of its contents without importing.
   */
  function previewImportFile(file: File): Promise<FilePreview> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const text = event.target?.result as string
          const data = JSON.parse(text) as ExportData

          // Determine which collections are present
          let collection: ExportCollection = 'all'
          const hasMembers = Array.isArray(data.members) && data.members.length > 0
          const hasInitiatives = Array.isArray(data.initiatives) && data.initiatives.length > 0
          const hasQuarters = Array.isArray(data.quarters) && data.quarters.length > 0
          const hasRoles = Array.isArray(data.roles) && data.roles.length > 0

          // If only one non-empty collection, identify it
          const nonEmpty = [hasMembers, hasInitiatives, hasQuarters, hasRoles].filter(Boolean).length
          if (nonEmpty === 1) {
            if (hasMembers && !hasInitiatives) collection = 'members'
            else if (hasInitiatives && !hasMembers) collection = 'initiatives'
          }

          const preview: ExportPreview = {
            members: Array.isArray(data.members) ? data.members.length : 0,
            initiatives: Array.isArray(data.initiatives) ? data.initiatives.length : 0,
            quarters: Array.isArray(data.quarters) ? data.quarters.length : 0,
            roles: Array.isArray(data.roles) ? data.roles.length : 0,
          }

          resolve({
            fileName: file.name,
            fileSize: formatFileSize(file.size),
            collection,
            preview,
          })
        } catch {
          reject(new Error('Failed to parse file'))
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  /**
   * Export data, optionally filtering to a specific collection.
   */
  function exportData(collection: ExportCollection = 'all'): void {
    const data: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      members: collection === 'all' || collection === 'members'
        ? JSON.parse(JSON.stringify(membersStore.members))
        : [],
      initiatives: collection === 'all' || collection === 'initiatives'
        ? JSON.parse(JSON.stringify(initiativesStore.initiatives))
        : [],
      quarters: collection === 'all'
        ? JSON.parse(JSON.stringify(quartersStore.quarters))
        : [],
      roles: collection === 'all'
        ? [...rolesStore.roles]
        : [],
    }

    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const today = new Date().toISOString().slice(0, 10)
    const suffix = collection !== 'all' ? `-${collection}` : ''
    const filename = `capest-planner-export${suffix}-${today}.json`

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Import data from a file.
   * Supports two modes: 'replace' (default) wipes existing data; 'merge' adds/updates.
   */
  function importData(file: File, mode: ImportMode = 'replace'): Promise<ImportResult> {
    return new Promise((resolve) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const text = event.target?.result as string
          const data = JSON.parse(text) as ExportData

          // Validate structure
          for (const key of REQUIRED_KEYS) {
            if (!(key in data)) {
              resolve({
                success: false,
                message: `Invalid file: missing required key "${key}"`,
              })
              return
            }
          }

          if (!Array.isArray(data.members) || !Array.isArray(data.initiatives) ||
              !Array.isArray(data.quarters) || !Array.isArray(data.roles)) {
            resolve({
              success: false,
              message: 'Invalid file: expected arrays for members, initiatives, quarters, and roles',
            })
            return
          }

          if (mode === 'replace') {
            doReplaceImport(data)
          } else {
            doMergeImport(data)
          }

          const summary = mode === 'merge'
            ? buildMergeSummary(data)
            : `Imported ${data.members.length} members, ${data.initiatives.length} initiatives, ${data.quarters.length} quarters, ${data.roles.length} roles`

          resolve({ success: true, message: summary })
        } catch (e) {
          resolve({
            success: false,
            message: `Failed to parse file: ${(e as Error).message}`,
          })
        }
      }

      reader.onerror = () => {
        resolve({
          success: false,
          message: 'Failed to read file',
        })
      }

      reader.readAsText(file)
    })
  }

  function doReplaceImport(data: ExportData) {
    // Clear existing data and replace
    membersStore.clearAll()
    initiativesStore.clearAll()
    quartersStore.clearAll()
    rolesStore.resetRoles()

    // Restore members
    membersStore.members.push(...data.members)

    // Restore initiatives
    initiativesStore.initiatives.push(...data.initiatives)

    // Restore quarters — reconstruct Date objects
    quartersStore.quarters.splice(0, quartersStore.quarters.length)
    quartersStore.quarters.push(
      ...data.quarters.map((q: QuarterConfig) => ({
        ...q,
        startDate: new Date(q.startDate),
        endDate: new Date(q.endDate),
      }))
    )

    // Restore roles
    rolesStore.roles.splice(0, rolesStore.roles.length)
    rolesStore.roles.push(...data.roles)
  }

  function doMergeImport(data: ExportData) {
    const existingMemberIds = new Set(membersStore.members.map(m => m.id))
    const existingInitiativeIds = new Set(initiativesStore.initiatives.map(i => i.id))
    const existingQuarterIds = new Set(quartersStore.quarters.map(q => q.id))

    // Merge members: add new, update existing by id
    for (const member of data.members) {
      if (existingMemberIds.has(member.id)) {
        const idx = membersStore.members.findIndex(m => m.id === member.id)
        if (idx !== -1) {
          membersStore.members[idx] = member
        }
      } else {
        membersStore.members.push(member)
      }
    }

    // Merge initiatives: add new, update existing by id
    for (const initiative of data.initiatives) {
      if (existingInitiativeIds.has(initiative.id)) {
        const idx = initiativesStore.initiatives.findIndex(i => i.id === initiative.id)
        if (idx !== -1) {
          initiativesStore.initiatives[idx] = initiative
        }
      } else {
        initiativesStore.initiatives.push(initiative)
      }
    }

    // Merge quarters: add new, update existing by id
    for (const q of data.quarters) {
      const reconstructed = {
        ...q,
        startDate: new Date(q.startDate),
        endDate: new Date(q.endDate),
      }
      if (existingQuarterIds.has(q.id)) {
        const idx = quartersStore.quarters.findIndex(qu => qu.id === q.id)
        if (idx !== -1) {
          quartersStore.quarters[idx] = reconstructed
        }
      } else {
        quartersStore.quarters.push(reconstructed)
      }
    }

    // Merge roles: add new roles
    for (const role of data.roles) {
      if (!rolesStore.roles.includes(role)) {
        rolesStore.roles.push(role)
      }
    }
  }

  function buildMergeSummary(data: ExportData): string {
    const existingMemberIds = new Set(membersStore.members.map(m => m.id))
    const newMembers = data.members.filter(m => !existingMemberIds.has(m.id)).length
    const updatedMembers = data.members.length - newMembers

    const parts: string[] = []
    if (data.members.length > 0) {
      parts.push(`${newMembers} new + ${updatedMembers} updated member${data.members.length !== 1 ? 's' : ''}`)
    }
    if (data.initiatives.length > 0) {
      const existingInitIds = new Set(initiativesStore.initiatives.map(i => i.id))
      const newInits = data.initiatives.filter(i => !existingInitIds.has(i.id)).length
      const updatedInits = data.initiatives.length - newInits
      parts.push(`${newInits} new + ${updatedInits} updated initiative${data.initiatives.length !== 1 ? 's' : ''}`)
    }
    if (data.quarters.length > 0) {
      parts.push(`${data.quarters.length} quarter${data.quarters.length !== 1 ? 's' : ''}`)
    }
    if (data.roles.length > 0) {
      const newRoles = data.roles.filter(r => !rolesStore.roles.includes(r)).length
      parts.push(`${newRoles} new role${newRoles !== 1 ? 's' : ''}`)
    }

    return `Merged: ${parts.join(', ')}`
  }

  return {
    exportData,
    importData,
    getExportPreview,
    previewImportFile,
  }
}
