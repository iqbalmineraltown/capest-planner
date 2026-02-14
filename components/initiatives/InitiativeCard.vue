<template>
  <v-card
    :color="isSelected ? 'primary-lighten-5' : undefined"
    :elevation="isHovered ? 4 : 2"
    class="initiative-card"
    data-testid="initiative-card"
    :class="{ 'selected-card': isSelected, 'cursor-pointer': !readonly }"
    @click="handleClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <v-card-item class="pa-4">
      <div class="d-flex align-start justify-space-between">
        <div class="flex-grow-1">
          <div class="d-flex align-center mb-2">
            <v-chip size="small" color="primary" variant="tonal" class="mr-2">
              {{ quarterLabel }}
            </v-chip>
            <v-chip
              v-if="initiative.carriesOverTo"
              size="small"
              color="warning"
              variant="tonal"
            >
              <v-icon start size="small">mdi-arrow-right-bold</v-icon>
              Carries Over
            </v-chip>
          </div>

          <h3 class="text-h6 mb-1">{{ initiative.name }}</h3>
          <p class="text-caption text-medium-emphasis mb-3">
            {{ truncatedDescription }}
          </p>

          <div class="d-flex flex-wrap gap-1 mb-2">
            <v-chip
              v-for="(req, idx) in initiative.roleRequirements"
              :key="`role-${idx}`"
              size="x-small"
              :color="getRoleColor(req.role)"
              variant="tonal"
            >
              <v-icon start size="x-small">mdi-account-outline</v-icon>
              {{ req.role }}: {{ req.effort }}w
            </v-chip>
          </div>
        </div>

        <v-menu v-if="!readonly" location="bottom end">
          <template #activator="{ props }">
            <v-btn
              icon="mdi-dots-vertical"
              variant="text"
              size="small"
              v-bind="props"
              @click.stop
            />
          </template>
          <v-list density="compact">
            <v-list-item
              prepend-icon="mdi-pencil"
              data-testid="edit-initiative-btn"
              @click.stop="$emit('edit', initiative.id)"
            >
              <v-list-item-title>Edit</v-list-item-title>
            </v-list-item>
            <v-list-item
              prepend-icon="mdi-delete-outline"
              class="text-error"
              data-testid="delete-initiative-btn"
              @click.stop="handleDelete"
            >
              <v-list-item-title>Delete</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-card-item>

    <v-divider />

    <v-card-item class="pa-3 bg-grey-lighten-5">
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon
            :color="assignmentStatus.color"
            size="small"
            class="mr-1"
          >
            {{ assignmentStatus.icon }}
          </v-icon>
          <span class="text-caption">
            {{ assignmentStatus.text }}
          </span>
        </div>

        <div class="d-flex align-center text-caption text-medium-emphasis">
          <v-icon size="x-small" class="mr-1">mdi-clock-outline</v-icon>
          {{ totalEffort }} manweeks
        </div>
      </div>
    </v-card-item>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import type { Initiative } from '~/types'
import { useQuartersStore } from '~/stores/quarters'

interface Props {
  initiative: Initiative
  readonly?: boolean
  selectedId?: string
}

interface Emits {
  'edit': [id: string]
  'delete': [id: string]
  'click': [initiative: Initiative]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const quartersStore = useQuartersStore()

const isHovered = ref(false)

const confirm = inject<((config: any) => Promise<boolean>) | null>('confirmDialog', null)

const isSelected = computed(() => props.selectedId === props.initiative.id)

const quarterLabel = computed(() => {
  const quarter = quartersStore.getQuarterById(props.initiative.quarter)
  return quarter?.label || props.initiative.quarter
})

const truncatedDescription = computed(() => {
  const desc = props.initiative.description
  return desc.length > 80 ? desc.substring(0, 80) + '...' : desc
})

const totalEffort = computed(() =>
  props.initiative.roleRequirements.reduce((sum, req) => sum + req.effort, 0)
)

const assignmentStatus = computed(() => {
  const assignedCount = props.initiative.assignments.length
  const totalRoles = props.initiative.roleRequirements.length

  if (assignedCount === 0) {
    return { icon: 'mdi-alert-circle-outline', color: 'warning', text: 'Unassigned' }
  }

  if (assignedCount < totalRoles) {
    return {
      icon: 'mdi-account-clock-outline',
      color: 'info',
      text: `${assignedCount}/${totalRoles} assigned`
    }
  }

  return { icon: 'mdi-check-circle-outline', color: 'success', text: 'Fully Assigned' }
})

function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    BE: 'blue',
    FE: 'green',
    MOBILE: 'purple',
    QA: 'orange'
  }
  return colors[role] || 'grey'
}

function handleClick() {
  if (!props.readonly) {
    emit('click', props.initiative)
  }
}

async function handleDelete() {
  if (!confirm) return

  const confirmed = await confirm({
    title: 'Delete Initiative?',
    message: `Are you sure you want to delete "${props.initiative.name}"? This action cannot be undone.`,
    icon: 'mdi-delete-outline',
    iconColor: 'error',
    confirmText: 'Delete',
    confirmColor: 'error',
    cancelText: 'Cancel'
  })

  if (confirmed) {
    emit('delete', props.initiative.id)
  }
}
</script>

<style scoped>
.initiative-card {
  transition: all 0.2s ease-in-out;
  border-left: 4px solid transparent;
}

.initiative-card:hover {
  border-left-color: rgb(var(--v-theme-primary));
}

.selected-card {
  border-left-color: rgb(var(--v-theme-primary));
}

.cursor-pointer {
  cursor: pointer;
}
</style>
