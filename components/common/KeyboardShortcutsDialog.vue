<template>
  <v-dialog v-model="dialog" max-width="500">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon start color="primary">mdi-keyboard</v-icon>
        Keyboard Shortcuts
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <template v-if="groupedShortcuts.length > 0">
          <div v-for="group in groupedShortcuts" :key="group.page" class="mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-2 text-primary">
              {{ group.page }}
            </div>
            <div
              v-for="(shortcut, idx) in group.shortcuts"
              :key="idx"
              class="d-flex align-center justify-space-between py-1"
            >
              <span class="text-body-2">{{ shortcut.description }}</span>
              <v-chip size="small" variant="outlined" label class="font-monospace">
                {{ shortcut.key }}
              </v-chip>
            </div>
          </div>
        </template>

        <!-- Global shortcuts always shown -->
        <div class="mb-2">
          <div class="text-subtitle-2 font-weight-bold mb-2 text-primary">
            Global
          </div>
          <div class="d-flex align-center justify-space-between py-1">
            <span class="text-body-2">Show keyboard shortcuts</span>
            <v-chip size="small" variant="outlined" label class="font-monospace">?</v-chip>
          </div>
          <div class="d-flex align-center justify-space-between py-1">
            <span class="text-body-2">Close any open dialog</span>
            <v-chip size="small" variant="outlined" label class="font-monospace">Escape</v-chip>
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="dialog = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGlobalShortcuts } from '~/composables/useKeyboardShortcuts'

const dialog = defineModel<boolean>({ default: false })
const { getAllShortcuts } = useGlobalShortcuts()

const groupedShortcuts = computed(() => {
  const all = getAllShortcuts()
  const groups: Record<string, Array<{ key: string; description: string }>> = {}
  for (const s of all) {
    if (!groups[s.page]) groups[s.page] = []
    groups[s.page].push({ key: s.key, description: s.description })
  }
  return Object.entries(groups).map(([page, shortcuts]) => ({ page, shortcuts }))
})
</script>
