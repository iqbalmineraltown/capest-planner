<template>
  <div class="settings-page">
    <!-- Page Header -->
    <div class="d-flex align-center mb-6">
      <v-icon color="primary" size="large" class="mr-3">mdi-cog</v-icon>
      <div>
        <h1 class="text-h4 font-weight-bold">Settings</h1>
        <p class="text-caption text-medium-emphasis">Configure your capacity planning workspace</p>
      </div>
    </div>

    <!-- ═══ ROLE MANAGEMENT ═══ -->
    <v-card class="mb-4" variant="outlined">
      <v-card-title class="d-flex align-center">
        <v-icon start color="primary">mdi-badge-account</v-icon>
        Role Management
      </v-card-title>
      <v-card-subtitle>Define the roles available for team members and initiatives</v-card-subtitle>

      <v-card-text>
        <!-- Existing roles -->
        <div class="d-flex flex-wrap gap-2 mb-4">
          <v-chip
            v-for="role in rolesStore.roles"
            :key="role"
            :color="rolesStore.getRoleColor(role)"
            label
            size="default"
            class="role-chip"
            @click="openEditRole(role)"
          >
            <v-icon start size="small">mdi-account-hard-hat</v-icon>
            {{ role }}
            <v-icon end size="x-small" class="ml-1 edit-hint">mdi-pencil</v-icon>
            <v-icon
              v-if="!rolesStore.isDefaultRole(role)"
              end
              size="x-small"
              class="ml-1 role-close-btn"
              @click.stop="confirmRemoveRole(role)"
            >mdi-close-circle</v-icon>
          </v-chip>
        </div>

        <!-- Add new role -->
        <v-row align="center" dense>
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="newRoleName"
              label="New Role Name"
              placeholder="e.g. DEVOPS, DATA, DESIGN"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              :error-messages="newRoleError"
              prepend-inner-icon="mdi-plus"
              @keydown.enter="addNewRole"
            />
          </v-col>
          <v-col cols="auto">
            <v-btn
              color="primary"
              variant="tonal"
              :disabled="!newRoleName.trim()"
              @click="addNewRole"
            >
              Add Role
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- ═══ QUARTER MANAGEMENT ═══ -->
    <v-card class="mb-4" variant="outlined">
      <v-card-title class="d-flex align-center">
        <v-icon start color="primary">mdi-calendar-range</v-icon>
        Quarter Management
      </v-card-title>
      <v-card-subtitle>Manage planning quarters and their configurations</v-card-subtitle>

      <v-card-text>
        <!-- Existing quarters -->
        <v-table density="comfortable" class="mb-4">
          <thead>
            <tr>
              <th>Quarter</th>
              <th>Weeks</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="quarter in quartersStore.sortedQuarters" :key="quarter.id">
              <td>
                <v-chip
                  size="small"
                  :color="quarter.id === currentQuarterId ? 'primary' : 'default'"
                  :variant="quarter.id === currentQuarterId ? 'flat' : 'tonal'"
                  label
                >
                  {{ quarter.label }}
                  <v-icon v-if="quarter.id === currentQuarterId" end size="small">mdi-star</v-icon>
                </v-chip>
              </td>
              <td>{{ quarter.totalWeeks }} weeks</td>
              <td>{{ formatDate(quarter.startDate) }}</td>
              <td>{{ formatDate(quarter.endDate) }}</td>
              <td class="text-center">
                <v-btn
                  icon="mdi-delete-outline"
                  size="small"
                  variant="text"
                  color="error"
                  :disabled="quartersStore.quarterCount <= 1"
                  @click="confirmRemoveQuarter(quarter.id, quarter.label)"
                >
                  <v-icon>mdi-delete-outline</v-icon>
                  <v-tooltip activator="parent" location="top">
                    {{ quartersStore.quarterCount <= 1 ? 'Cannot remove the last quarter' : 'Remove quarter' }}
                  </v-tooltip>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>

        <!-- Add new quarter -->
        <v-row align="center" dense>
          <v-col cols="6" sm="3" md="2">
            <v-select
              v-model="newQuarterNumber"
              :items="[1, 2, 3, 4]"
              label="Quarter"
              variant="outlined"
              density="comfortable"
              hide-details
              :item-title="(q: number) => `Q${q}`"
            />
          </v-col>
          <v-col cols="6" sm="3" md="2">
            <v-text-field
              v-model.number="newQuarterYear"
              label="Year"
              type="number"
              variant="outlined"
              density="comfortable"
              hide-details
              :min="2020"
              :max="2040"
            />
          </v-col>
          <v-col cols="auto">
            <v-btn
              color="primary"
              variant="tonal"
              :disabled="!canAddQuarter"
              @click="addNewQuarter"
            >
              Add Quarter
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- ═══ DATA MANAGEMENT ═══ -->
    <v-card class="mb-4" variant="outlined">
      <v-card-title class="d-flex align-center">
        <v-icon start color="primary">mdi-database-cog</v-icon>
        Data Management
      </v-card-title>
      <v-card-subtitle>Export, import, or reset your planning data</v-card-subtitle>

      <v-card-text>
        <!-- Storage info -->
        <v-alert type="info" density="compact" variant="tonal" class="mb-4">
          <v-row dense align="center">
            <v-col cols="auto" v-for="(stat, idx) in storageStats" :key="idx">
              <span><strong>{{ stat.count }}</strong> {{ stat.label }}</span>
            </v-col>
          </v-row>
        </v-alert>

        <v-row dense>
          <v-col cols="12" sm="6" md="4">
            <v-btn
              block
              variant="outlined"
              color="primary"
              prepend-icon="mdi-export"
              @click="handleExport"
            >
              Export Data
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-btn
              block
              variant="outlined"
              color="primary"
              prepend-icon="mdi-import"
              @click="triggerImport"
            >
              Import Data
            </v-btn>
            <input
              ref="fileInputRef"
              type="file"
              accept=".json"
              style="display: none"
              @change="handleFileSelected"
            />
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <h4 class="text-subtitle-1 font-weight-medium mb-3 text-error">
          <v-icon start color="error">mdi-alert-circle-outline</v-icon>
          Danger Zone
        </h4>
        <v-row dense>
          <v-col cols="12" sm="6" md="4">
            <v-btn
              block
              variant="outlined"
              color="error"
              prepend-icon="mdi-delete-outline"
              @click="showClearDialog = true"
            >
              Clear All Data
            </v-btn>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-btn
              block
              variant="outlined"
              color="warning"
              prepend-icon="mdi-refresh"
              @click="showResetDialog = true"
            >
              Reset with Sample Data
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- ═══ THEME PREFERENCES ═══ -->
    <v-card class="mb-4" variant="outlined">
      <v-card-title class="d-flex align-center">
        <v-icon start color="primary">mdi-palette</v-icon>
        Theme Preferences
      </v-card-title>
      <v-card-subtitle>Customize the look and feel of your workspace</v-card-subtitle>

      <v-card-text>
        <v-btn-toggle
          :model-value="themeMode"
          mandatory
          color="primary"
          variant="outlined"
          @update:model-value="setTheme($event as ThemeMode)"
        >
          <v-btn value="light" prepend-icon="mdi-white-balance-sunny">
            Light
          </v-btn>
          <v-btn value="dark" prepend-icon="mdi-moon-waning-crescent">
            Dark
          </v-btn>
          <v-btn value="system" prepend-icon="mdi-theme-light-dark">
            System
          </v-btn>
        </v-btn-toggle>

        <div class="text-caption text-medium-emphasis mt-2">
          Currently using <strong>{{ currentThemeLabel }}</strong> theme
        </div>
      </v-card-text>
    </v-card>

    <!-- ═══ ABOUT ═══ -->
    <v-card variant="outlined">
      <v-card-title class="d-flex align-center">
        <v-icon start color="primary">mdi-information-outline</v-icon>
        About
      </v-card-title>

      <v-card-text>
        <v-list density="compact" class="bg-transparent">
          <v-list-item>
            <template #prepend>
              <v-icon color="primary">mdi-calendar-clock</v-icon>
            </template>
            <v-list-item-title>Capest Planner</v-list-item-title>
            <v-list-item-subtitle>v{{ appVersion }} — Capacity Planning Application</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <template #prepend>
              <v-icon color="primary">mdi-code-tags</v-icon>
            </template>
            <v-list-item-title>Tech Stack</v-list-item-title>
            <v-list-item-subtitle>Nuxt 3 • Vue 3 • Vuetify 3 • Pinia</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <template #prepend>
              <v-icon color="primary">mdi-harddisk</v-icon>
            </template>
            <v-list-item-title>Storage</v-list-item-title>
            <v-list-item-subtitle>All data is stored locally in your browser (localStorage)</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- ═══ DIALOGS ═══ -->

    <!-- Clear all data dialog -->
    <v-dialog v-model="showClearDialog" max-width="450" persistent>
      <v-card>
        <v-card-title class="d-flex align-center text-error">
          <v-icon start color="error">mdi-alert-circle</v-icon>
          Clear All Data?
        </v-card-title>
        <v-card-text>
          This will <strong>permanently delete</strong> all members, initiatives, quarter
          configurations, and custom roles. This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showClearDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="handleClearAll">
            <v-icon start>mdi-delete</v-icon>
            Clear All
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reset with sample data dialog -->
    <v-dialog v-model="showResetDialog" max-width="450" persistent>
      <v-card>
        <v-card-title class="d-flex align-center text-warning">
          <v-icon start color="warning">mdi-refresh</v-icon>
          Reset with Sample Data?
        </v-card-title>
        <v-card-text>
          This will <strong>replace all existing data</strong> with the One Piece themed
          sample dataset (Straw Hat Pirates). Your current data will be lost.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showResetDialog = false">Cancel</v-btn>
          <v-btn color="warning" variant="flat" @click="handleResetWithSample">
            <v-icon start>mdi-refresh</v-icon>
            Reset with Samples
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Import data dialog -->
    <v-dialog v-model="showImportDialog" max-width="450" persistent>
      <v-card>
        <v-card-title class="text-h6">
          <v-icon start color="primary">mdi-import</v-icon>
          Import Data?
        </v-card-title>
        <v-card-text>
          This will <strong>replace all existing data</strong> with the contents of the
          selected file. This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelImport">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="confirmImport">
            Import
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm remove role dialog -->
    <v-dialog v-model="showRemoveRoleDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6">Remove Role?</v-card-title>
        <v-card-text>
          Remove the role <v-chip :color="rolesStore.getRoleColor(roleToRemove)" label size="small">{{ roleToRemove }}</v-chip>?
          This will not affect existing member or initiative assignments.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showRemoveRoleDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="executeRemoveRole">Remove</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit role dialog -->
    <v-dialog v-model="showEditRoleDialog" max-width="450" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon start color="primary">mdi-palette</v-icon>
          Edit Role
        </v-card-title>
        <v-card-text>
          <!-- Role name -->
          <v-text-field
            v-if="!rolesStore.isDefaultRole(editRoleOriginalName)"
            v-model="editRoleName"
            label="Role Name"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :error-messages="editRoleError"
            class="mb-4"
          />
          <div v-else class="mb-4">
            <span class="text-caption text-medium-emphasis">Role</span>
            <div>
              <v-chip :color="editRoleColor" label>{{ editRoleOriginalName }}</v-chip>
              <span class="text-caption text-medium-emphasis ml-2">(default role — name cannot be changed)</span>
            </div>
          </div>

          <!-- Color picker -->
          <div class="text-subtitle-2 mb-2">Color</div>
          <div class="d-flex flex-wrap gap-2">
            <v-avatar
              v-for="color in AVAILABLE_COLORS"
              :key="color"
              :color="color"
              size="36"
              class="color-swatch"
              :class="{ 'color-swatch--selected': editRoleColor === color }"
              @click="editRoleColor = color"
            >
              <v-icon v-if="editRoleColor === color" color="white" size="small">mdi-check</v-icon>
            </v-avatar>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showEditRoleDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveEditRole">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm remove quarter dialog -->
    <v-dialog v-model="showRemoveQuarterDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6">Remove Quarter?</v-card-title>
        <v-card-text>
          Remove <strong>{{ quarterToRemoveLabel }}</strong>? Initiatives assigned to this
          quarter will not be deleted but will have an invalid quarter reference.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showRemoveQuarterDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="executeRemoveQuarter">Remove</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMembersStore } from '~/stores/members'
import { useInitiativesStore } from '~/stores/initiatives'
import { useQuartersStore } from '~/stores/quarters'
import { useRolesStore } from '~/stores/roles'
import { useDataExport } from '~/composables/useDataExport'
import { useSeedData } from '~/composables/useSeedData'
import { useAppTheme, type ThemeMode } from '~/composables/useAppTheme'
import { useToast } from '~/composables/useToast'
import { getCurrentQuarterId } from '~/utils/dateUtils'

const membersStore = useMembersStore()
const initiativesStore = useInitiativesStore()
const quartersStore = useQuartersStore()
const rolesStore = useRolesStore()
const { exportData, importData } = useDataExport()
const { clearAllData, resetWithSampleData } = useSeedData()
const { mode: themeMode, currentTheme, setTheme } = useAppTheme()
const toast = useToast()

const runtimeConfig = useRuntimeConfig()
const appVersion = runtimeConfig.public.appVersion as string
const currentQuarterId = getCurrentQuarterId()

// ─── Theme ──────────────────────────────────────────────────
const currentThemeLabel = computed(() => {
  if (themeMode.value === 'system') return `System (${currentTheme.value})`
  return currentTheme.value === 'dark' ? 'Dark' : 'Light'
})

// ─── Role Management ────────────────────────────────────────
const newRoleName = ref('')
const newRoleError = ref('')
const showRemoveRoleDialog = ref(false)
const roleToRemove = ref('')

// Edit role dialog
const showEditRoleDialog = ref(false)
const editRoleName = ref('')
const editRoleOriginalName = ref('')
const editRoleColor = ref('')
const editRoleError = ref('')

const AVAILABLE_COLORS = [
  'blue', 'green', 'orange', 'purple', 'teal', 'red', 'pink', 'indigo',
  'cyan', 'lime', 'amber', 'deep-orange', 'brown', 'blue-grey', 'light-blue', 'deep-purple',
]

function addNewRole() {
  const name = newRoleName.value.toUpperCase().trim()
  if (!name) return

  if (rolesStore.roles.includes(name)) {
    newRoleError.value = `Role "${name}" already exists`
    return
  }

  rolesStore.addRole(name)
  newRoleName.value = ''
  newRoleError.value = ''
  toast.success(`Role "${name}" added`)
}

function confirmRemoveRole(role: string) {
  roleToRemove.value = role
  showRemoveRoleDialog.value = true
}

function onRoleChipClick(event: Event, role: string) {
  // Don't open edit dialog if the close button was clicked
  const target = event.target as HTMLElement
  if (target.closest('.v-chip__close')) return
  openEditRole(role)
}

function executeRemoveRole() {
  const role = roleToRemove.value
  rolesStore.removeRole(role)
  showRemoveRoleDialog.value = false
  toast.success(`Role "${role}" removed`)
}

function openEditRole(role: string) {
  editRoleName.value = role
  editRoleOriginalName.value = role
  editRoleColor.value = rolesStore.getRoleColor(role)
  editRoleError.value = ''
  showEditRoleDialog.value = true
}

function saveEditRole() {
  const newName = editRoleName.value.toUpperCase().trim()

  // Handle rename for custom roles
  if (!rolesStore.isDefaultRole(editRoleOriginalName.value) && newName !== editRoleOriginalName.value) {
    if (!newName) {
      editRoleError.value = 'Role name cannot be empty'
      return
    }
    if (rolesStore.roles.includes(newName)) {
      editRoleError.value = `Role "${newName}" already exists`
      return
    }
    rolesStore.renameRole(editRoleOriginalName.value, newName)
  }

  // Update color
  const targetRole = rolesStore.isDefaultRole(editRoleOriginalName.value) ? editRoleOriginalName.value : newName
  rolesStore.updateRoleColor(targetRole, editRoleColor.value)

  showEditRoleDialog.value = false
  toast.success(`Role "${targetRole}" updated`)
}

// ─── Quarter Management ─────────────────────────────────────
const newQuarterNumber = ref(Math.floor(new Date().getMonth() / 3) + 1)
const newQuarterYear = ref(new Date().getFullYear())
const showRemoveQuarterDialog = ref(false)
const quarterToRemoveId = ref('')
const quarterToRemoveLabel = ref('')

const canAddQuarter = computed(() => {
  const id = `Q${newQuarterNumber.value}-${newQuarterYear.value}`
  return !quartersStore.sortedQuarters.some((q) => q.id === id) &&
    newQuarterYear.value >= 2020 && newQuarterYear.value <= 2040
})

function addNewQuarter() {
  const result = quartersStore.addQuarter(newQuarterYear.value, newQuarterNumber.value)
  if (result) {
    toast.success(`Quarter ${result.label} added`)
  } else {
    toast.error('Failed to add quarter — it may already exist')
  }
}

function confirmRemoveQuarter(id: string, label: string) {
  quarterToRemoveId.value = id
  quarterToRemoveLabel.value = label
  showRemoveQuarterDialog.value = true
}

function executeRemoveQuarter() {
  const success = quartersStore.removeQuarter(quarterToRemoveId.value)
  showRemoveQuarterDialog.value = false
  if (success) {
    toast.success(`Quarter "${quarterToRemoveLabel.value}" removed`)
  } else {
    toast.error('Cannot remove the last quarter')
  }
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ─── Data Management ────────────────────────────────────────
const showClearDialog = ref(false)
const showResetDialog = ref(false)
const showImportDialog = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const pendingFile = ref<File | null>(null)

const storageStats = computed(() => [
  { count: membersStore.memberCount, label: 'members' },
  { count: initiativesStore.initiativeCount, label: 'initiatives' },
  { count: quartersStore.quarterCount, label: 'quarters' },
  { count: rolesStore.roles.length, label: 'roles' },
])

function handleExport() {
  exportData()
  toast.success('Data exported successfully')
}

function triggerImport() {
  fileInputRef.value?.click()
}

function handleFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  pendingFile.value = file
  showImportDialog.value = true
  input.value = ''
}

function cancelImport() {
  showImportDialog.value = false
  pendingFile.value = null
}

async function confirmImport() {
  showImportDialog.value = false
  if (!pendingFile.value) return

  const result = await importData(pendingFile.value)
  pendingFile.value = null

  if (result.success) {
    toast.success(result.message)
  } else {
    toast.error(result.message)
  }
}

function handleClearAll() {
  clearAllData()
  showClearDialog.value = false
  toast.success('All data cleared')
}

function handleResetWithSample() {
  resetWithSampleData()
  showResetDialog.value = false
  toast.success('Data reset with sample dataset')
}
</script>

<style scoped>
.settings-page {
  max-width: 900px;
  margin: 0 auto;
}

.role-chip {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.role-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.role-chip .edit-hint {
  opacity: 0;
  transition: opacity 0.15s ease;
}
.role-chip:hover .edit-hint {
  opacity: 0.7;
}

.color-swatch {
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.15s ease, border-color 0.15s ease;
}
.color-swatch:hover {
  transform: scale(1.15);
}
.color-swatch--selected {
  border-color: rgb(var(--v-theme-on-surface));
  transform: scale(1.1);
}
</style>
