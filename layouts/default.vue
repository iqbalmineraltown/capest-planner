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
import { ref, onMounted } from 'vue'
import { useSeedData } from '~/composables/useSeedData'
import { useAppTheme } from '~/composables/useAppTheme'
import AppDrawer from '~/components/common/AppDrawer.vue'
import AppHeader from '~/components/common/AppHeader.vue'
import ConfirmDialog from '~/components/common/ConfirmDialog.vue'

const drawer = ref(true)
const { seedDefaultData } = useSeedData()
const { applyTheme } = useAppTheme()

// Seed default data and apply theme on app load
onMounted(() => {
  seedDefaultData()
  applyTheme()
})
</script>

<style scoped>
.v-main {
  background-color: rgb(var(--v-theme-background));
  min-height: 100vh;
  transition: background-color 0.3s ease;
}
</style>
