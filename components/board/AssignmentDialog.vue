<template>
  <v-dialog
    :model-value="modelValue"
    max-width="520"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="assignment-dialog" rounded="xl">
      <!-- Header -->
      <div class="assignment-dialog__header">
        <div>
          <h3 class="assignment-dialog__title">
            {{ isNew ? 'New Assignment' : 'Edit Assignment' }}
          </h3>
          <p v-if="initiative" class="assignment-dialog__subtitle">
            {{ initiative.name }}
          </p>
        </div>
        <v-btn icon size="small" variant="text" @click="$emit('update:modelValue', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-divider />

      <v-card-text class="pa-5">
        <!-- Week conflict alert -->
        <v-alert
          v-if="weekConflict.hasConflict"
          type="error"
          density="compact"
          variant="tonal"
          class="mb-4"
          rounded="lg"
        >
          <strong>Week conflict!</strong> Member already assigned:
          <ul class="mt-1 mb-0 pl-4">
            <li v-for="c in weekConflict.conflicts" :key="c.initiativeId">
              <strong>W{{ c.weeks.join(', ') }}</strong>: {{ c.initiativeName }}
            </li>
          </ul>
        </v-alert>

        <v-form ref="formRef" v-model="isFormValid">
          <!-- Member -->
          <v-select
            v-model="formData.memberId"
            :items="memberOptions"
            label="Team Member"
            variant="outlined"
            rounded="lg"
            :rules="[v => !!v || 'Required']"
            :disabled="!isNew"
            class="mb-3"
          >
            <template #item="{ item, props: itemProps }">
              <v-list-item v-bind="itemProps">
                <template #prepend>
                  <v-avatar size="28" color="primary" variant="tonal">
                    <span class="text-caption font-weight-bold">
                      {{ getInitials(item.raw.name) }}
                    </span>
                  </v-avatar>
                </template>
                <v-list-item-subtitle class="text-caption">
                  {{ item.raw.roles.join(', ') }}
                </v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-select>

          <!-- Role -->
          <v-select
            v-model="formData.role"
            :items="roleOptions"
            label="Role"
            variant="outlined"
            rounded="lg"
            :rules="[v => !!v || 'Required']"
            class="mb-3"
          />

          <!-- Weeks & Start week side by side -->
          <v-row dense>
            <v-col cols="6">
              <v-text-field
                v-model.number="formData.weeksAllocated"
                label="Weeks"
                type="number"
                variant="outlined"
                rounded="lg"
                :min="1"
                :max="quarter?.totalWeeks || 13"
                :rules="[
                  v => v > 0 || 'Min 1',
                  v => v <= (quarter?.totalWeeks || 13) || 'Too many'
                ]"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="formData.startWeek"
                label="Start Week"
                type="number"
                variant="outlined"
                rounded="lg"
                :min="1"
                :max="quarter?.totalWeeks || 13"
                :rules="[
                  v => v >= 1 || 'Min 1',
                  v => v <= (quarter?.totalWeeks || 13) || 'Too high'
                ]"
              />
            </v-col>
          </v-row>

          <!-- Carryover info -->
          <v-alert
            v-if="carriesOver"
            type="info"
            density="compact"
            variant="tonal"
            rounded="lg"
            class="mt-2"
          >
            <v-icon start size="16">mdi-arrow-right-bold</v-icon>
            Carries over {{ carriedWeeks }} week(s) to next quarter
          </v-alert>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn
          v-if="!isNew"
          color="error"
          variant="text"
          rounded="lg"
          @click="$emit('delete')"
        >
          <v-icon start>mdi-delete-outline</v-icon>
          Delete
        </v-btn>
        <v-spacer />
        <v-btn
          variant="text"
          rounded="lg"
          @click="$emit('update:modelValue', false)"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          :disabled="!isFormValid || weekConflict.hasConflict"
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
import { checkCarryOver, checkWeekConflicts } from '~/utils/capacityCalculator'

const props = defineProps<{
  modelValue: boolean
  initiative: Initiative | null
  assignment: Assignment | null
  members: TeamMember[]
  quarter: QuarterConfig | undefined
  allInitiatives: Initiative[]
  initialMemberId?: string
  initialRole?: string
  initialStartWeek?: number
  excludeInitiativeId?: string
  excludeAssignmentIndex?: number
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
  isParallel: true,
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
  rolesStore.roles.map((r) => ({ title: r, value: r }))
)

// Week conflict check
const weekConflict = computed(() => {
  if (!formData.value.memberId || !props.quarter) {
    return { hasConflict: false, conflicts: [] }
  }
  return checkWeekConflicts(
    formData.value.memberId,
    formData.value.startWeek,
    formData.value.weeksAllocated,
    props.allInitiatives,
    props.quarter.id,
    props.excludeInitiativeId,
    props.excludeAssignmentIndex
  )
})

// Carryover check
const carriesOver = computed(() => {
  if (!props.quarter) return false
  const endWeek = formData.value.startWeek + formData.value.weeksAllocated - 1
  return endWeek > props.quarter.totalWeeks
})

const carriedWeeks = computed(() => {
  if (!props.quarter) return 0
  const endWeek = formData.value.startWeek + formData.value.weeksAllocated - 1
  return Math.max(0, endWeek - props.quarter.totalWeeks)
})

// Initialize form when dialog opens
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return

    if (props.assignment) {
      formData.value = {
        memberId: props.assignment.memberId,
        role: props.assignment.role,
        weeksAllocated: props.assignment.weeksAllocated,
        startWeek: props.assignment.startWeek,
        isParallel: props.assignment.isParallel,
      }
    } else {
      formData.value = {
        memberId: props.initialMemberId || '',
        role: props.initialRole || '',
        weeksAllocated: 1,
        startWeek: props.initialStartWeek || 1,
        isParallel: true,
      }
    }
  }
)

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function handleSave() {
  const assignment: Assignment = {
    memberId: formData.value.memberId,
    role: formData.value.role,
    weeksAllocated: formData.value.weeksAllocated,
    startWeek: formData.value.startWeek,
    isParallel: formData.value.isParallel,
  }
  emit('save', assignment)
}
</script>

<style scoped>
.assignment-dialog {
  overflow: hidden;
}

.assignment-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 20px 12px;
}

.assignment-dialog__title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.assignment-dialog__subtitle {
  font-size: 0.82rem;
  color: #9e9e9e;
  margin: 2px 0 0;
}

.v-theme--dark .assignment-dialog__title {
  color: #e0e0e0;
}
</style>
