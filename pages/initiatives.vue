<template>
  <div class="initiatives-page">
    <v-row align="center" class="mb-4">
      <v-col cols="12" sm="6">
        <div class="d-flex align-center">
          <v-icon color="primary" size="large" class="mr-3">
            mdi-lightbulb-on-outline
          </v-icon>
          <div>
            <h1 class="text-h4 font-weight-bold">Initiatives</h1>
            <p class="text-caption text-medium-emphasis">
              {{ initiativeCount }} initiative{{ initiativeCount !== 1 ? 's' : '' }} planned
            </p>
          </div>
        </div>
      </v-col>

      <v-col cols="12" sm="6" class="text-sm-right">
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          size="large"
          @click="openCreateDialog"
        >
          Add Initiative
          <v-tooltip activator="parent" location="bottom">
            Add new initiative <kbd class="ml-1">n</kbd>
          </v-tooltip>
        </v-btn>
      </v-col>
    </v-row>

    <v-card class="mb-4">
      <v-card-text class="pa-4">
        <v-row align="center">
          <v-col cols="12" sm="4">
            <v-select
              v-model="selectedQuarter"
              :items="quarterOptions"
              label="Filter by Quarter"
              density="comfortable"
              variant="outlined"
              clearable
              hide-details
              prepend-inner-icon="mdi-calendar-outline"
              @update:model-value="handleQuarterFilter"
            >
              <template #selection="{ item }">
                <v-chip size="small" color="primary" variant="tonal">
                  {{ item.raw?.label || item.title }}
                </v-chip>
              </template>
              <template #item="{ item, props }">
                <v-list-item v-bind="props">
                  <template #prepend>
                    <v-icon :color="item.raw?.color">mdi-calendar</v-icon>
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </v-col>

          <v-col cols="12" sm="4" offset-sm="4">
            <v-btn-toggle
              v-model="displayMode"
              mandatory
              variant="outlined"
              density="comfortable"
              color="primary"
              class="w-100"
            >
              <v-btn value="grid" prepend-icon="mdi-view-grid-outline">
                Grid
              </v-btn>
              <v-btn value="list" prepend-icon="mdi-view-list-outline">
                List
              </v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <InitiativeList
      :quarter-filter="selectedQuarter"
      :display-mode="displayMode"
      :selected-id="selectedInitiative?.id"
      @edit="openEditDialog"
      @delete="handleDelete"
      @select="handleSelect"
    />

    <!-- Empty state override when no initiatives at all -->
    <div v-if="initiativeCount === 0" class="text-center py-8">
      <v-icon size="80" color="grey-lighten-2">mdi-lightbulb-on-outline</v-icon>
      <h3 class="mt-4 text-grey-darken-1">No Initiatives Yet</h3>
      <p class="text-grey mt-1 mb-4">Create your first initiative to start planning capacity allocation.</p>
      <v-btn
        color="primary"
        variant="tonal"
        prepend-icon="mdi-plus"
        @click="openCreateDialog"
      >
        Create First Initiative
      </v-btn>
    </div>

    <v-dialog v-model="showFormDialog" max-width="800" persistent>
      <v-card>
        <InitiativeForm
          :initiative="editingInitiative"
          @save="handleSave"
          @cancel="closeFormDialog"
        />
      </v-card>
    </v-dialog>

    <KeyboardShortcutsDialog v-model="showShortcutsDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Initiative } from '~/types'
import { useInitiativesStore } from '~/stores/initiatives'
import { useQuartersStore } from '~/stores/quarters'
import InitiativeList from '~/components/initiatives/InitiativeList.vue'
import InitiativeForm from '~/components/initiatives/InitiativeForm.vue'
import { useToast } from '~/composables/useToast'
import { useKeyboardShortcuts, useGlobalShortcuts } from '~/composables/useKeyboardShortcuts'

const initiativesStore = useInitiativesStore()
const quartersStore = useQuartersStore()
const toast = useToast()
const { registerShortcuts, unregisterShortcuts } = useGlobalShortcuts()

const showFormDialog = ref(false)
const editingInitiative = ref<Initiative | undefined>(undefined)
const selectedInitiative = ref<Initiative | null>(null)
const selectedQuarter = ref<string | null>(null)
const displayMode = ref<'grid' | 'list'>('grid')
const showShortcutsDialog = ref(false)

// Register keyboard shortcuts for this page
useKeyboardShortcuts([
  {
    key: 'n',
    description: 'New initiative',
    handler: () => openCreateDialog(),
  },
  {
    key: '?',
    description: 'Show keyboard shortcuts',
    handler: () => { showShortcutsDialog.value = !showShortcutsDialog.value },
  },
  {
    key: 'Escape',
    description: 'Close any open dialog',
    handler: () => {
      if (showFormDialog.value) closeFormDialog()
      if (showShortcutsDialog.value) showShortcutsDialog.value = false
    },
    requireNoInput: false,
  },
])

// Register page shortcuts for the global help dialog
onMounted(() => {
  registerShortcuts('Initiatives', [
    { key: 'n', description: 'New initiative' },
    { key: '?', description: 'Show keyboard shortcuts' },
    { key: 'Escape', description: 'Close any open dialog' },
  ])
})

onUnmounted(() => {
  unregisterShortcuts('Initiatives')
})

const initiativeCount = computed(() => initiativesStore.initiativeCount)

const quarterOptions = computed(() => {
  const quarters = quartersStore.sortedQuarters
  return quarters.map(q => ({
    title: q.id,
    value: q.id,
    label: q.label,
    color: 'primary'
  }))
})

function openCreateDialog() {
  editingInitiative.value = undefined
  showFormDialog.value = true
}

function openEditDialog(id: string) {
  editingInitiative.value = initiativesStore.getInitiativeById(id)
  showFormDialog.value = true
}

function closeFormDialog() {
  showFormDialog.value = false
  editingInitiative.value = undefined
}

function handleSave(initiative: Initiative) {
  const isEdit = !!editingInitiative.value
  closeFormDialog()
  selectedInitiative.value = initiative
  toast.success(isEdit ? 'Initiative updated successfully' : 'Initiative added successfully')
}

function handleDelete(id: string) {
  initiativesStore.removeInitiative(id)
  if (selectedInitiative.value?.id === id) {
    selectedInitiative.value = null
  }
  toast.success('Initiative deleted successfully')
}

function handleSelect(initiative: Initiative) {
  selectedInitiative.value = initiative
}

function handleQuarterFilter(value: string | null) {
  selectedQuarter.value = value
}
</script>

<style scoped>
.initiatives-page {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
