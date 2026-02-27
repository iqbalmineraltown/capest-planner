<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit">
    <v-card>
      <v-card-title class="d-flex align-center py-4">
        <v-icon start :color="isEditMode ? 'warning' : 'success'">
          {{ isEditMode ? 'mdi-pencil' : 'mdi-plus-circle' }}
        </v-icon>
        {{ isEditMode ? 'Edit Initiative' : 'New Initiative' }}
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <v-text-field
          v-model="formData.name"
          label="Initiative Name"
          placeholder="Enter initiative name"
          density="comfortable"
          variant="outlined"
          :rules="[rules.required]"
          required
          autofocus
          class="mb-4"
        >
          <template #prepend-inner>
            <v-icon color="primary">mdi-tag-outline</v-icon>
          </template>
        </v-text-field>

        <v-textarea
          v-model="formData.description"
          label="Description"
          placeholder="Describe the initiative objectives and scope"
          density="comfortable"
          variant="outlined"
          rows="3"
          auto-grow
          :rules="[rules.required]"
          required
          class="mb-4"
        >
          <template #prepend-inner>
            <v-icon color="primary">mdi-text-box-outline</v-icon>
          </template>
        </v-textarea>

        <v-select
          v-model="formData.quarter"
          :items="availableQuarters"
          item-title="label"
          item-value="id"
          label="Quarter"
          density="comfortable"
          variant="outlined"
          :rules="[rules.required]"
          required
          class="mb-4"
        >
          <template #prepend-inner>
            <v-icon color="primary">mdi-calendar-outline</v-icon>
          </template>
          <template #item="{ item, props: itemProps }">
            <v-list-item v-bind="itemProps">
              <v-list-item-title>
                <v-chip size="small" color="primary" variant="tonal">
                  {{ item.raw.label }}
                </v-chip>
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ item.raw.totalWeeks }} weeks available
              </v-list-item-subtitle>
            </v-list-item>
          </template>
          <template #selection="{ item }">
            <v-chip size="small" color="primary" variant="tonal">
              {{ item.raw.label }}
            </v-chip>
          </template>
        </v-select>

        <div class="mb-2">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="d-flex align-center">
              <v-icon color="accent" class="mr-2">mdi-account-group-outline</v-icon>
              <span class="text-subtitle-2">Role Requirements</span>
            </div>
            <v-btn
              size="small"
              color="accent"
              variant="tonal"
              prepend-icon="mdi-plus"
              @click="addRoleRequirement"
            >
              Add Role
            </v-btn>
          </div>

          <div v-if="formData.roleRequirements.length === 0" class="text-center pa-6">
            <v-icon size="48" color="grey-lighten-1" class="mb-2">
              mdi-account-multiple-remove
            </v-icon>
            <p class="text-caption text-medium-emphasis">
              No role requirements added. Add at least one role to define resource needs.
            </p>
          </div>

          <div v-else class="role-requirements-list">
            <RoleRequirementInput
              v-for="(req, index) in formData.roleRequirements"
              :key="index"
              :requirement="req"
              :index="index"
              @update="updateRoleRequirement(index, $event)"
              @remove="removeRoleRequirement(index)"
            />
          </div>

          <v-alert
            v-if="formData.roleRequirements.length > 0"
            type="info"
            density="compact"
            variant="tonal"
            class="mt-2"
          >
            <template #prepend>
              <v-icon>mdi-information-outline</v-icon>
            </template>
            Total effort: <strong>{{ totalEffort }} manweeks</strong> across
            <strong>{{ formData.roleRequirements.length }}</strong> role{{ formData.roleRequirements.length > 1 ? 's' : '' }}
          </v-alert>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          variant="text"
          color="grey"
          prepend-icon="mdi-close"
          @click="$emit('cancel')"
        >
          Cancel
        </v-btn>
        <v-btn
          type="submit"
          color="primary"
          variant="flat"
          :loading="submitting"
          prepend-icon="mdi-content-save"
        >
          {{ isEditMode ? 'Save Changes' : 'Create Initiative' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Initiative, RoleRequirement, QuarterConfig } from '~/types'
import { useInitiativesStore } from '~/stores/initiatives'
import { useQuartersStore } from '~/stores/quarters'
import { useRolesStore } from '~/stores/roles'

interface Props {
  initiative?: Initiative
}

interface Emits {
  'save': [initiative: Initiative]
  'cancel': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const initiativesStore = useInitiativesStore()
const quartersStore = useQuartersStore()
const rolesStore = useRolesStore()

const formRef = ref()
const submitting = ref(false)

const isEditMode = computed(() => !!props.initiative)

const availableQuarters = computed(() => quartersStore.sortedQuarters)

interface FormData {
  name: string
  description: string
  quarter: string
  roleRequirements: RoleRequirement[]
}

const formData = ref<FormData>({
  name: '',
  description: '',
  quarter: quartersStore.currentQuarter?.id || '',
  roleRequirements: []
})

const totalEffort = computed(() =>
  formData.value.roleRequirements.reduce((sum, req) => sum + req.effort, 0)
)

const rules = {
  required: (value: any) => !!value || 'This field is required',
  minRoles: () => formData.value.roleRequirements.length > 0 || 'Add at least one role requirement'
}

function addRoleRequirement() {
  const availableRole = rolesStore.roles.find(
    role => !formData.value.roleRequirements.some(req => req.role === role)
  ) || rolesStore.roles[0]

  formData.value.roleRequirements.push({
    role: availableRole,
    effort: 1
  })
}

function updateRoleRequirement(index: number, requirement: RoleRequirement) {
  formData.value.roleRequirements[index] = requirement
}

function removeRoleRequirement(index: number) {
  formData.value.roleRequirements.splice(index, 1)
}

async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  if (formData.value.roleRequirements.length === 0) {
    return
  }

  submitting.value = true

  try {
    let initiative: Initiative

    if (isEditMode.value && props.initiative) {
      const success = initiativesStore.updateInitiative(props.initiative.id, {
        name: formData.value.name,
        description: formData.value.description,
        quarter: formData.value.quarter,
        roleRequirements: formData.value.roleRequirements
      })

      if (!success) {
        return
      }

      initiative = initiativesStore.getInitiativeById(props.initiative.id)!
    } else {
      initiative = initiativesStore.addInitiative({
        name: formData.value.name,
        description: formData.value.description,
        quarter: formData.value.quarter,
        roleRequirements: formData.value.roleRequirements
      })
    }

    emit('save', initiative)
  } finally {
    submitting.value = false
  }
}

watch(() => props.initiative, (initiative) => {
  if (initiative) {
    formData.value = {
      name: initiative.name,
      description: initiative.description,
      quarter: initiative.quarter,
      roleRequirements: [...initiative.roleRequirements]
    }
  } else {
    formData.value = {
      name: '',
      description: '',
      quarter: quartersStore.currentQuarter?.id || '',
      roleRequirements: []
    }
  }
}, { immediate: true })
</script>

<style scoped>
.role-requirements-list {
  max-height: 300px;
  overflow-y: auto;
}
</style>
