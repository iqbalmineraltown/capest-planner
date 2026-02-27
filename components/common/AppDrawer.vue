<template>
  <v-navigation-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    app
    width="260"
  >
    <v-list nav density="comfortable">
      <v-list-item
        prepend-icon="mdi-view-dashboard"
        title="Dashboard"
        to="/"
        exact
        color="primary"
      />

      <v-list-item
        prepend-icon="mdi-account-group"
        title="Team Members"
        to="/members"
        color="primary"
      />

      <v-list-item
        prepend-icon="mdi-lightbulb-outline"
        title="Initiatives"
        to="/initiatives"
        color="primary"
      />

      <v-list-item
        prepend-icon="mdi-view-column"
        title="Capacity Board"
        to="/board"
        color="primary"
      />
    </v-list>

    <v-divider class="my-2" />

    <v-list-subheader>Quick Stats</v-list-subheader>

    <v-list nav density="compact">
      <v-list-item>
        <template #prepend>
          <v-icon color="primary">mdi-account</v-icon>
        </template>
        <v-list-item-title>Members</v-list-item-title>
        <v-list-item-subtitle>{{ memberCount }}</v-list-item-subtitle>
      </v-list-item>

      <v-list-item>
        <template #prepend>
          <v-icon color="accent">mdi-lightbulb</v-icon>
        </template>
        <v-list-item-title>Initiatives</v-list-item-title>
        <v-list-item-subtitle>{{ initiativeCount }}</v-list-item-subtitle>
      </v-list-item>

      <v-list-item>
        <template #prepend>
          <v-icon color="secondary">mdi-calendar</v-icon>
        </template>
        <v-list-item-title>Quarters</v-list-item-title>
        <v-list-item-subtitle>{{ quarterCount }}</v-list-item-subtitle>
      </v-list-item>
    </v-list>

    <template #append>
      <div class="pa-4 d-flex flex-column ga-2">
        <v-btn
          block
          variant="outlined"
          color="primary"
          size="small"
          prepend-icon="mdi-export"
          @click="handleExport"
        >
          Export Data
        </v-btn>

        <v-btn
          block
          variant="outlined"
          color="primary"
          size="small"
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

        <v-btn
          block
          variant="outlined"
          color="error"
          size="small"
          prepend-icon="mdi-delete-outline"
          @click="showClearDialog = true"
        >
          Clear All Data
        </v-btn>
      </div>
    </template>

    <v-dialog v-model="showClearDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Clear All Data?</v-card-title>
        <v-card-text>
          This will permanently delete all members, initiatives, and custom quarter
          configurations. This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showClearDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="handleClearAll">
            Clear All
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showImportDialog" max-width="450">
      <v-card>
        <v-card-title class="text-h6">Import Data?</v-card-title>
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

    <v-snackbar v-model="showSnackbar" :color="snackbarColor" :timeout="4000">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMembersStore } from '~/stores/members'
import { useInitiativesStore } from '~/stores/initiatives'
import { useQuartersStore } from '~/stores/quarters'
import { useDataExport } from '~/composables/useDataExport'

defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const membersStore = useMembersStore()
const initiativesStore = useInitiativesStore()
const quartersStore = useQuartersStore()
const { exportData, importData } = useDataExport()

const showClearDialog = ref(false)
const showImportDialog = ref(false)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref<'success' | 'error'>('success')
const fileInputRef = ref<HTMLInputElement | null>(null)
const pendingFile = ref<File | null>(null)

const memberCount = computed(() => membersStore.memberCount)
const initiativeCount = computed(() => initiativesStore.initiativeCount)
const quarterCount = computed(() => quartersStore.quarterCount)

function handleExport() {
  exportData()
  snackbarMessage.value = 'Data exported successfully'
  snackbarColor.value = 'success'
  showSnackbar.value = true
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
  // Reset input so the same file can be selected again
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

  snackbarMessage.value = result.message
  snackbarColor.value = result.success ? 'success' : 'error'
  showSnackbar.value = true
}

function handleClearAll() {
  membersStore.clearAll()
  initiativesStore.clearAll()
  quartersStore.clearAll()
  showClearDialog.value = false
}
</script>
