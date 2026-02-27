<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit">
    <!-- Name input -->
    <v-text-field
      v-model="formData.name"
      label="Name *"
      placeholder="Enter member name"
      :rules="nameRules"
      variant="outlined"
      prepend-inner-icon="mdi-account"
      required
      class="mb-3"
    />

    <!-- Role selection with chips -->
    <div class="mb-3">
      <v-label class="d-block mb-2">Roles *</v-label>
      <v-combobox
        v-model="formData.roles"
        :items="availableRoles"
        label="Select or type roles"
        placeholder="Choose roles..."
        :rules="roleRules"
        chips
        multiple
        closable-chips
        variant="outlined"
        prepend-inner-icon="mdi-badge-account"
      >
        <template #chip="{ props: chipProps, item }">
          <v-chip
            v-bind="chipProps"
            :color="getRoleColor(item.raw)"
            label
          />
        </template>
      </v-combobox>
      <div class="text-caption text-grey-darken-1 mt-1">
        Select from existing roles or type a custom role name
      </div>
    </div>

    <!-- Availability input -->
    <v-text-field
      v-model.number="formData.availability"
      label="Availability (manweeks) *"
      type="number"
      min="1"
      max="13"
      placeholder="1-13"
      :rules="availabilityRules"
      variant="outlined"
      prepend-inner-icon="mdi-clock-outline"
      required
      hint="Number of manweeks available per quarter (1-13)"
      persistent-hint
      class="mb-4"
    />

    <!-- Actions -->
    <div class="d-flex justify-end ga-2">
      <v-btn
        variant="text"
        color="grey-darken-1"
        @click="$emit('cancel')"
      >
        Cancel
      </v-btn>
      <v-btn
        type="submit"
        color="primary"
        variant="elevated"
        :loading="submitting"
      >
        {{ isEditing ? 'Save Changes' : 'Add Member' }}
      </v-btn>
    </div>
  </v-form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { TeamMember } from '~/types'
import { useRolesStore } from '~/stores/roles'
import { useMembersStore } from '~/stores/members'

interface Props {
  memberId?: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [member: TeamMember]
  cancel: []
}>()

const rolesStore = useRolesStore()
const membersStore = useMembersStore()

const formRef = ref()
const submitting = ref(false)

// Available roles from store
const availableRoles = computed(() => rolesStore.roles)

// Is editing mode
const isEditing = computed(() => !!props.memberId)

// Form data
const formData = ref<{
  name: string
  roles: string[]
  availability: number
}>({
  name: '',
  roles: [],
  availability: 10,
})

// Load member data for editing
watch(() => props.memberId, (newId) => {
  if (newId) {
    const member = membersStore.getMemberById(newId)
    if (member) {
      formData.value = {
        name: member.name,
        roles: [...member.roles],
        availability: member.availability,
      }
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// Validation rules
const nameRules = [
  (v: string) => !!v?.trim() || 'Name is required',
  (v: string) => (v?.length ?? 0) >= 2 || 'Name must be at least 2 characters',
]

const roleRules = [
  (v: string[]) => (v?.length ?? 0) > 0 || 'At least one role is required',
]

const availabilityRules = [
  (v: number) => v !== null && v !== undefined || 'Availability is required',
  (v: number) => v >= 1 || 'Minimum availability is 1 manweek',
  (v: number) => v <= 13 || 'Maximum availability is 13 manweeks',
]

// Get color for role
function getRoleColor(role: string): string {
  const roleColors: Record<string, string> = {
    BE: 'blue',
    FE: 'green',
    MOBILE: 'orange',
    QA: 'purple',
  }
  return roleColors[role.toUpperCase()] || 'grey'
}

// Reset form
function resetForm() {
  formData.value = {
    name: '',
    roles: [],
    availability: 10,
  }
  formRef.value?.resetValidation()
}

// Handle form submission
async function handleSubmit() {
  const { valid } = await formRef.value?.validate()

  if (!valid) {
    return
  }

  submitting.value = true

  try {
    // Add custom roles to store
    for (const role of formData.value.roles) {
      rolesStore.addRole(role)
    }

    let member: TeamMember

    if (isEditing.value && props.memberId) {
      // Update existing member
      membersStore.updateMember(props.memberId, {
        name: formData.value.name.trim(),
        roles: formData.value.roles,
        availability: formData.value.availability,
      })
      member = membersStore.getMemberById(props.memberId)!
    } else {
      // Create new member
      member = membersStore.addMember({
        name: formData.value.name.trim(),
        roles: formData.value.roles,
        availability: formData.value.availability,
      })
    }

    emit('submit', member)
    resetForm()
  } finally {
    submitting.value = false
  }
}
</script>
