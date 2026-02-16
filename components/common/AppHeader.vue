<template>
  <v-app-bar color="primary" density="comfortable" elevation="2">
    <template #prepend>
      <v-app-bar-nav-icon @click="$emit('toggle-drawer')" />
    </template>

    <v-app-bar-title class="font-weight-medium">
      <v-icon start>mdi-calendar-clock</v-icon>
      Capest Planner
    </v-app-bar-title>

    <template #append>
      <div class="d-flex align-center ga-1">
        <ThemeToggle />
        <v-btn icon="mdi-refresh" @click="handleRefresh" title="Refresh Data" />
        <v-btn icon="mdi-cog" to="/settings" title="Settings" />
      </div>
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
import ThemeToggle from './ThemeToggle.vue'

defineEmits<{
  'toggle-drawer': []
}>()

function handleRefresh() {
  window.location.reload()
}
</script>
