<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="500" persistent>
    <v-card>
      <v-card-title>
        <span class="text-h6">
          {{ isNew ? 'Add Assignment' : 'Edit Assignment' }}
        </span>
        <span v-if="initiative" class="text-subtitle-2 text-grey ml-2">
          - {{ initiative.name }}
        </span>
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-form ref="formRef" v-model="isFormValid">
          <!-- Member selection -->
          <v-select
            v-model="formData.memberId"
            :items="memberOptions"
            label="Team Member"
            variant="outlined"
            :rules="[v => !!v || 'Member is required']"
            :disabled="!isNew"
            class="mb-3"
          >
            <template #item="{ item, props: itemProps }">
              <v-list-item v-bind="itemProps">
                <template #prepend>
                  <v-avatar size="small" :color="getMemberColor(item.raw.name)">
                    {{ getInitials(item.raw.name) }}
                  </v-avatar>
                </template>
                <v-list-item-subtitle>
                  {{ item.raw.roles.join(', ') }}
                </v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-select>

          <!-- Role selection -->
          <v-select
            v-model="formData.role"
            :items="roleOptions"
            label="Role"
            variant="outlined"
            :rules="[v => !!v || 'Role is required']"
            class="mb-3"
          />

          <!-- Weeks allocated -->
          <v-text-field
            v-model.number="formData.weeksAllocated"
            label="Weeks Allocated"
            type="number"
            variant="outlined"
            :min="1"
            :max="quarter?.totalWeeks || 13"
            :rules="[
              v => v > 0 || 'Must be at least 1 week',
              v => v <= (quarter?.totalWeeks || 13) || 'Exceeds quarter weeks'
            ]"
            class="mb-3"
          />

          <!-- Start week -->
          <v-text-field
            v-model.number="formData.startWeek"
            label="Start Week"
            type="number"
            variant="outlined"
            :min="1"
            :max="quarter?.totalWeeks || 13"
            :rules="[
              v => v >= 1 || 'Must be at least week 1',
              v => v <= (quarter?.totalWeeks || 13) || 'Exceeds quarter weeks'
            ]"
            class="mb-3"
          />

          <!-- Parallel toggle -->
          <v-switch
            v-model="formData.isParallel"
            label="Parallel with other assignments"
            color="primary"
            hide-details
          />

          <!-- Carryover info -->
          <v-alert
            v-if="carriesOver"
            type="info"
            density="compact"
            variant="tonal"
            class="mt-3"
          >
            This assignment will carry over {{ carriedWeeks }} week(s) to the next quarter
          </v-alert>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn
          v-if="!isNew"
          color="error"
          variant="text"
          @click="$emit('delete')"
        >
          Delete
        </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!isFormValid"
          @click="handleSave"
        >
          {{ isNew ? 'Add' : 'Save' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Initiative, Assignment, TeamMember, QuarterConfig } from '~/types'
import { useRolesStore } from '~/stores/roles'
import { checkCarryOver } from '~/utils/capacityCalculator'

const props = defineProps<{
  modelValue: boolean
  initiative: Initiative | null
  assignment: Assignment | null
  members: TeamMember[]
  quarter: QuarterConfig | undefined
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [assignment: Assignment]
  'delete': []
}>()

const rolesStore = useRolesStore()
const formRef = ref()
const isFormValid = ref(false)

const formData = ref({
  memberId: '',
  role: '',
  weeksAllocated: 1,
  startWeek: 1,
  isParallel: false,
})

const isNew = computed(() => !props.assignment)

const memberOptions = computed(() =>
  props.members.map((m) => ({
    title: m.name,
    value: m.id,
    name: m.name,
    roles: m.roles,
  }))
)

const roleOptions = computed(() =>
  rolesStore.roles.map((r) => ({
    title: r,
    value: r,
  }))
)

const carriesOver = computed(() => {
  if (!props.quarter) return false
  const result = checkCarryOver(formData.value, props.quarter)
  return result.carriesOver
})

const carriedWeeks = computed(() => {
  if (!props.quarter) return 0
  const result = checkCarryOver(formData.value, props.quarter)
  return result.carriedWeeks
})

// Initialize form when assignment changes
watch(
  () => props.assignment,
  (assignment) => {
    if (assignment) {
      formData.value = {
        memberId: assignment.memberId,
        role: assignment.role,
        weeksAllocated: assignment.weeksAllocated,
        startWeek: assignment.startWeek,
        isParallel: assignment.isParallel,
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// Pre-select role based on initiative requirements
watch(
  () => props.initiative,
  (initiative) => {
    if (initiative && isNew.value && initiative.roleRequirements.length > 0) {
      formData.value.role = initiative.roleRequirements[0].role
    }
  }
)

function resetForm() {
  formData.value = {
    memberId: '',
    role: '',
    weeksAllocated: 1,
    startWeek: 1,
    isParallel: false,
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getMemberColor(name: string): string {
  const colors = ['primary', 'secondary', 'success', 'warning', 'info', 'error']
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

function handleSave() {
  const assignment: Assignment = {
    memberId: formData.value.memberId,
    role: formData.value.role,
    weeksAllocated: formData.value.weeksAllocated,
    startWeek: formData.value.startWeek,
    isParallel: formData.value.isParallel,
    carriesOver: carriesOver.value,
    carriedWeeks: carriedWeeks.value,
  }

  emit('save', assignment)
}
</script>
