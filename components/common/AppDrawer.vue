<template>
  <v-navigation-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    app
    color="grey-lighten-4"
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
      <div class="pa-4">
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
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMembersStore } from '~/stores/members'
import { useInitiativesStore } from '~/stores/initiatives'
import { useQuartersStore } from '~/stores/quarters'

defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const membersStore = useMembersStore()
const initiativesStore = useInitiativesStore()
const quartersStore = useQuartersStore()

const showClearDialog = ref(false)

const memberCount = computed(() => membersStore.memberCount)
const initiativeCount = computed(() => initiativesStore.initiativeCount)
const quarterCount = computed(() => quartersStore.quarterCount)

function handleClearAll() {
  membersStore.clearAll()
  initiativesStore.clearAll()
  quartersStore.clearAll()
  showClearDialog.value = false
}
</script>
