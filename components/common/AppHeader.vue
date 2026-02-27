<template>
  <v-app-bar color="primary" density="comfortable" elevation="2">
    <template #prepend>
      <v-app-bar-nav-icon @click="$emit('toggle-drawer')" />
    </template>

    <v-app-bar-title class="font-weight-medium">
      <v-icon start>mdi-calendar-clock</v-icon>
      Capest Planner
    </v-app-bar-title>
  </v-app-bar>
</template>

<script setup lang="ts">
defineEmits<{
  'toggle-drawer': []
}>()
</script>
