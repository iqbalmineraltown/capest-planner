<template>
  <v-app>
    <AppDrawer v-model="drawer" />
    <AppHeader @toggle-drawer="drawer = !drawer" />

    <v-main>
      <v-container fluid class="pa-4">
        <slot />
      </v-container>
    </v-main>

    <ConfirmDialog />
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const drawer = ref(true)
</script>

<style scoped>
.v-main {
  background-color: #f5f5f5;
  min-height: 100vh;
}
</style>
