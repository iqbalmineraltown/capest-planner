<script setup lang="ts">
import { useAppTheme } from '~/composables/useAppTheme'

const { cycleTheme, getModeIcon, getModeLabel } = useAppTheme()
</script>

<template>
  <v-tooltip :text="getModeLabel()" location="bottom">
    <template #activator="{ props: tooltipProps }">
      <v-btn
        v-bind="tooltipProps"
        icon
        variant="text"
        class="theme-toggle-btn"
        @click="cycleTheme"
      >
        <v-icon :icon="getModeIcon()" />
      </v-btn>
    </template>
  </v-tooltip>
</template>

<style scoped>
.theme-toggle-btn :deep(.v-icon) {
  transition: transform 0.3s ease;
}

.theme-toggle-btn:hover :deep(.v-icon) {
  transform: rotate(15deg);
}
</style>
