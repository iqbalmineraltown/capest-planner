<template>
  <v-card :key="index" variant="outlined" class="role-req-card mb-2">
    <v-card-text class="pa-3">
      <v-row align="center" no-gutters>
        <v-col cols="12" sm="4">
          <v-select
            :model-value="requirement.role"
            :items="availableRoles"
            label="Role"
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="updateRole"
          >
            <template #item="{ item, props }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-avatar size="24" :color="getRoleColor(item.value)" class="text-caption text-white">
                    {{ item.value?.charAt(0) }}
                  </v-avatar>
                </template>
              </v-list-item>
            </template>
            <template #selection="{ item }">
              <v-avatar size="20" :color="getRoleColor(item.value)" class="text-caption text-white mr-2">
                {{ item.value?.charAt(0) }}
              </v-avatar>
              {{ item.value }}
            </template>
          </v-select>
        </v-col>

        <v-col cols="6" sm="3" class="pl-sm-2">
          <v-text-field
            :model-value="requirement.effort"
            type="number"
            label="Effort (MW)"
            density="compact"
            variant="outlined"
            min="1"
            hide-details
            @update:model-value="updateEffort"
          >
            <template #append-inner>
              <v-tooltip text="Manweeks of effort required">
                <template #activator="{ props }">
                  <v-icon v-bind="props" size="small">mdi-clock-outline</v-icon>
                </template>
              </v-tooltip>
            </template>
          </v-text-field>
        </v-col>

        <v-col cols="6" sm="3" class="pl-sm-2">
          <div class="d-flex align-center h-100">
            <v-chip size="small" color="info" variant="tonal">
              <v-icon start size="small">mdi-account-hard-hat</v-icon>
              {{ requirement.effort }} wk{{ requirement.effort > 1 ? 's' : '' }}
            </v-chip>
          </div>
        </v-col>

        <v-col cols="12" sm="2" class="text-right pl-sm-2">
          <v-btn
            icon="mdi-delete-outline"
            variant="text"
            color="error"
            size="small"
            @click="$emit('remove')"
          >
            <v-icon>mdi-delete-outline</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RoleRequirement } from '~/types'
import { useRolesStore } from '~/stores/roles'

interface Props {
  requirement: RoleRequirement
  index: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update': [requirement: RoleRequirement]
  'remove': []
}>()

const rolesStore = useRolesStore()
const availableRoles = computed(() => rolesStore.roles)

function updateRole(role: string) {
  emit('update', { role, effort: props.requirement.effort })
}

function updateEffort(effort: number | string) {
  const numEffort = typeof effort === 'string' ? parseInt(effort) || 0 : effort
  emit('update', { role: props.requirement.role, effort: Math.max(0, numEffort) })
}

function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    BE: 'blue',
    FE: 'green',
    MOBILE: 'orange',
    QA: 'purple'
  }
  return colors[role.toUpperCase()] || 'grey'
}
</script>

<style scoped>
.role-req-card {
  transition: all 0.2s ease-in-out;
}

.role-req-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
