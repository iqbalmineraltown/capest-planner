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

const REQUIRED_KEYS: (keyof Pick<ExportData, 'members' | 'initiatives' | 'quarters' | 'roles'>)[] = [
  'members',
  'initiatives',
  'quarters',
  'roles',
]

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

  function exportData(): void {
    const data: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      members: JSON.parse(JSON.stringify(membersStore.members)),
      initiatives: JSON.parse(JSON.stringify(initiativesStore.initiatives)),
      quarters: JSON.parse(JSON.stringify(quartersStore.quarters)),
      roles: [...rolesStore.roles],
    }

    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const today = new Date().toISOString().slice(0, 10)
    const filename = `capest-planner-export-${today}.json`

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function importData(file: File): Promise<ImportResult> {
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

          const summary = `Imported ${data.members.length} members, ${data.initiatives.length} initiatives, ${data.quarters.length} quarters, ${data.roles.length} roles`
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

  return {
    exportData,
    importData,
    getExportPreview,
  }
}
