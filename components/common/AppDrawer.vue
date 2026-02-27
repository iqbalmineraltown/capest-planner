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

      <v-list-item
        prepend-icon="mdi-cog"
        title="Settings"
        to="/settings"
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
          color="primary"
          size="small"
          prepend-icon="mdi-cog"
          to="/settings"
        >
          Settings
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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

const memberCount = computed(() => membersStore.memberCount)
const initiativeCount = computed(() => initiativesStore.initiativeCount)
const quarterCount = computed(() => quartersStore.quarterCount)
</script>
