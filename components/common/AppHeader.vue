<template>
  <v-app-bar color="primary" density="comfortable" elevation="3" rounded="lg">
    <template #prepend>
      <v-app-bar-nav-icon @click="$emit('toggle-drawer')" />
    </template>

    <v-app-bar-title class="font-weight-bold">
      <v-icon start>mdi-grid</v-icon>
      Capest Planner
    </v-app-bar-title>

    <template #append>
      <ThemeToggle />
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
defineEmits<{
  'toggle-drawer': []
}>()
</script>