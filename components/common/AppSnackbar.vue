<template>
  <v-snackbar
    v-model="toast._visible.value"
    :color="snackbarColor"
    :timeout="-1"
    location="bottom"
    class="app-snackbar rounded-lg"
    elevation="2"
  >
    <div class="d-flex align-center">
      <v-icon :icon="snackbarIcon" class="mr-3" size="large" />
      <span class="text-body-1">{{ toast.message.value }}</span>
    </div>

    <template #actions>
      <v-btn
        variant="text"
        icon="mdi-close"
        size="small"
        @click="toast.dismiss()"
      />
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from '~/composables/useToast'
import type { ToastType } from '~/composables/useToast'

const toast = useToast()

const iconMap: Record<ToastType, string> = {
  success: 'mdi-check-circle',
  error: 'mdi-alert-circle',
  warning: 'mdi-alert',
  info: 'mdi-information',
}

const colorMap: Record<ToastType, string> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info',
}

const snackbarIcon = computed(() => iconMap[toast.type.value])
const snackbarColor = computed(() => colorMap[toast.type.value])
</script>

<style scoped>
.app-snackbar :deep(.v-snackbar__content) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
}

.app-snackbar {
  margin: 16px;
  min-width: 350px;
}
</style>
