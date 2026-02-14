<template>
  <!-- This is a global confirm dialog managed via provide/inject -->
  <v-dialog v-model="isOpen" max-width="500" persistent>
    <v-card v-if="config">
      <v-card-title class="text-h6">
        <v-icon v-if="config.icon" :color="config.iconColor" class="mr-2">
          {{ config.icon }}
        </v-icon>
        {{ config.title }}
      </v-card-title>

      <v-card-text>
        {{ config.message }}
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleCancel">
          {{ config.cancelText || 'Cancel' }}
        </v-btn>
        <v-btn
          :color="config.confirmColor || 'primary'"
          variant="flat"
          @click="handleConfirm"
        >
          {{ config.confirmText || 'Confirm' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'

export interface ConfirmConfig {
  title: string
  message: string
  icon?: string
  iconColor?: string
  confirmText?: string
  confirmColor?: string
  cancelText?: string
}

const isOpen = ref(false)
const config = ref<ConfirmConfig | null>(null)
let resolvePromise: ((value: boolean) => void) | null = null

async function confirm(confirmConfig: ConfirmConfig): Promise<boolean> {
  config.value = confirmConfig
  isOpen.value = true

  return new Promise((resolve) => {
    resolvePromise = resolve
  })
}

function handleConfirm() {
  isOpen.value = false
  resolvePromise?.(true)
  resolvePromise = null
}

function handleCancel() {
  isOpen.value = false
  resolvePromise?.(false)
  resolvePromise = null
}

// Provide the confirm function globally
provide('confirmDialog', confirm)
</script>
