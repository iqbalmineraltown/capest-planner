<template>
  <v-navigation-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    app
    width="280"
    rounded
    elevation="4"
    overlay-opacity="0.5"
  >
    <v-sheet class="pa-4" color="surface">
      <v-icon size="32" class="mb-2">mdi-grid</v-icon>
      <div class="text-subtitle-1 font-weight-bold">Capest Planner</div>
    </v-sheet>

    <v-divider />

    <v-list nav density="comfortable">
      <v-list-item
        v-for="item in navItems"
        :key="item.title"
        v-bind="item"
        color="primary"
        density="compact"
      />
    </v-list>

    <template #append>
      <v-sheet class="pa-4 ma-2">
        <v-btn
          block
          variant="outlined"
          color="primary"
          size="small"
          prepend-icon="mdi-cog"
          to="/settings"
          density="compact"
        >
          Settings
        </v-btn>
      </v-sheet>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const navItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/' },
  { title: 'Team Members', icon: 'mdi-account-group', to: '/members' },
  { title: 'Initiatives', icon: 'mdi-lightbulb-outline', to: '/initiatives' },
  { title: 'Capacity Board', icon: 'mdi-view-column', to: '/board' },
]
</script>
