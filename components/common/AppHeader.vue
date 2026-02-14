<template>
  <v-app-bar color="primary" density="prominent" elevation="2">
    <template #prepend>
      <v-app-bar-nav-icon @click="$emit('toggle-drawer')" />
    </template>

    <v-app-bar-title>
      <div class="d-flex align-center">
        <v-icon start>mdi-calendar-clock</v-icon>
        <span>Capest Planner</span>
      </div>
    </v-app-bar-title>

    <template #append>
      <v-btn icon="mdi-refresh" @click="handleRefresh" title="Refresh Data" />
      <v-btn icon="mdi-cog" to="/settings" title="Settings" />
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
defineEmits<{
  'toggle-drawer': []
}>()

function handleRefresh() {
  window.location.reload()
}
</script>

<style scoped>
.v-app-bar-title {
  font-weight: 600;
}
</style>
