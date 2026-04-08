<script setup lang="ts">
import { useAppTheme } from '~/composables/useAppTheme'

const { cycleTheme, getModeIcon, getModeLabel } = useAppTheme()
</script>

<template>
  <v-tooltip :text="getModeLabel()" location="bottom" rounded>
    <template #activator="{ props: tooltipProps }">
      <v-btn
        v-bind="tooltipProps"
        icon
        variant="text"
        class="theme-toggle-btn"
        size="large"
        @click="cycleTheme"
      >
        <v-icon :icon="getModeIcon()" size="large" />
      </v-btn>
    </template>
  </v-tooltip>
</template>

<style scoped>
.theme-toggle-btn :deep(.v-icon) {
  transition: transform 0.3s ease, color 0.2s ease;
}

.theme-toggle-btn:hover :deep(.v-icon) {
  transform: rotate(15deg) scale(1.1);
}
</style>
