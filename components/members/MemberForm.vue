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
      class="mb-4"
    />

    <!-- Role selection with chips -->
    <div class="mb-4">
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
      <div class="text-caption text--secondary mt-1">
        Select from existing roles or type a custom role name
      </div>
    </div>

    <!-- Quarter Availability Section -->
    <div class="mb-4">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center">
          <v-label class="d-block">Quarter Availability (manweeks)</v-label>
          <v-tooltip location="top" :open-delay="200" max-width="280">
            <template #activator="{ props: tp }">
              <v-icon v-bind="tp" size="18" color="grey" class="ml-2">mdi-help-circle-outline</v-icon>
            </template>
            Specify how many weeks a member is available in each quarter. Only members with availability > 0 appear on the capacity board.
          </v-tooltip>
        </div>
        <v-btn
          size="x-small"
          variant="text"
          color="primary"
          prepend-icon="mdi-plus"
          @click="showAddQuarterDialog = true"
        >
          Add Quarter
        </v-btn>
      </div>
      
      <v-card variant="outlined" class="quarter-availability-card rounded">
        <v-list density="compact" v-if="availableQuarters.length > 0">
          <v-list-item
            v-for="quarter in availableQuarters"
            :key="quarter.id"
            class="px-2"
          >
            <template #prepend>
              <v-chip size="small" color="primary" variant="tonal" class="mr-2">
                {{ quarter.label }
              </v-chip>
            </template>
            
            <v-text-field
              v-model.number="formData.quarterAvailability[quarter.id]"
              type="number"
              min="0"
              max="13"
              density="compact"
              variant="outlined"
              :rules="quarterAvailabilityRules"
              placeholder="0"
              style="max-width: 120px;"
              class="ml-2"
            >
              <template #append-inner>
                <span class="text-caption text--secondary">weeks</span>
              </template>
            </v-text-field>

            <template #append>
              <v-btn
                icon="mdi-close"
                size="x-small"
                variant="text"
                color="grey"
                @click="removeQuarterAvailability(quarter.id)"
              />
            </template>
          </v-list-item>
        </v-list>
        
        <v-card-text v-else class="text-center text--secondary py-4">
          <v-icon size="32", class="mb-2">mdi-calendar-blank</v-icon>
          <div>No quarters configured. Add a quarter to set availability.</div>
        </v-card-text>
      </v-card>
      <div class="text-caption text--secondary mt-1">
        Set available manweeks for each quarter. Members will only appear on boards for quarters where availability > 0.
      </div>
    </div>

    <!-- Actions -->
    <div class="d-flex justify-end gap-2">
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

    <!-- Add Quarter Dialog -->
    <v-dialog v-model="showAddQuarterDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Add Quarter Availability</v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedNewQuarter"
            :items="unconfiguredQuarters"
            item-title="label"
            item-value="id"
            label="Select Quarter"
            variant="outlined"
            return-object
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showAddQuarterDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            variant="elevated"
            :disabled="!selectedNewQuarter"
            @click="addQuarterAvailability"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-form>
</template>
      </v-combobox>
      <div class="text-caption text-grey-darken-1 mt-1">
        Select from existing roles or type a custom role name
      </div>
    </div>

    <!-- Quarter Availability Section -->
    <div class="mb-3">
      <div class="d-flex align-center justify-space-between mb-2">
        <div class="d-flex align-center">
          <v-label class="d-block">Quarter Availability (manweeks)</v-label>
          <v-tooltip location="top" :open-delay="200" max-width="280">
            <template #activator="{ props: tp }">
              <v-icon v-bind="tp" size="18" color="grey" class="ml-2">mdi-help-circle-outline</v-icon>
            </template>
            Specify how many weeks a member is available in each quarter. Only members with availability &gt; 0 appear on the capacity board.
          </v-tooltip>
        </div>
        <v-btn
          size="x-small"
          variant="text"
          color="primary"
          prepend-icon="mdi-plus"
          @click="showAddQuarterDialog = true"
        >
          Add Quarter
        </v-btn>
      </div>
      
      <v-card variant="outlined" class="quarter-availability-card">
        <v-list density="compact" v-if="availableQuarters.length > 0">
          <v-list-item
            v-for="quarter in availableQuarters"
            :key="quarter.id"
            class="px-2"
          >
            <template #prepend>
              <v-chip size="small" color="primary" variant="tonal" class="mr-2">
                {{ quarter.label }}
              </v-chip>
            </template>
            
            <v-text-field
              v-model.number="formData.quarterAvailability[quarter.id]"
              type="number"
              min="0"
              max="13"
              density="compact"
              variant="outlined"
              :rules="quarterAvailabilityRules"
              placeholder="0"
              style="max-width: 100px;"
              class="ml-2"
            >
              <template #append-inner>
                <span class="text-caption text-grey">weeks</span>
              </template>
            </v-text-field>

            <template #append>
              <v-btn
                icon="mdi-close"
                size="x-small"
                variant="text"
                color="grey"
                @click="removeQuarterAvailability(quarter.id)"
              />
            </template>
          </v-list-item>
        </v-list>
        
        <v-card-text v-else class="text-center text-grey py-4">
          <v-icon size="32" class="mb-2">mdi-calendar-blank</v-icon>
          <div>No quarters configured. Add a quarter to set availability.</div>
        </v-card-text>
      </v-card>
      <div class="text-caption text-grey-darken-1 mt-1">
        Set available manweeks for each quarter. Members will only appear on boards for quarters where availability &gt; 0.
      </div>
    </div>

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

    <!-- Add Quarter Dialog -->
    <v-dialog v-model="showAddQuarterDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Add Quarter Availability</v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedNewQuarter"
            :items="unconfiguredQuarters"
            item-title="label"
            item-value="id"
            label="Select Quarter"
            variant="outlined"
            return-object
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showAddQuarterDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            variant="elevated"
            :disabled="!selectedNewQuarter"
            @click="addQuarterAvailability"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { TeamMember, QuarterConfig } from '~/types'
import { useRolesStore } from '~/stores/roles'
import { useMembersStore } from '~/stores/members'
import { useQuartersStore } from '~/stores/quarters'

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
const quartersStore = useQuartersStore()

const formRef = ref()
const submitting = ref(false)
const showAddQuarterDialog = ref(false)
const selectedNewQuarter = ref<QuarterConfig | null>(null)

// Available roles from store
const availableRoles = computed(() => rolesStore.roles)

// Is editing mode
const isEditing = computed(() => !!props.memberId)

// Form data
const formData = ref<{
  name: string
  roles: string[]
  quarterAvailability: Record<string, number>
}>({
  name: '',
  roles: [],
  quarterAvailability: {},
})

// Get quarters that have availability configured
const availableQuarters = computed(() => {
  const quarterIds = Object.keys(formData.value.quarterAvailability)
  return quartersStore.quarters
    .filter(q => quarterIds.includes(q.id))
    .sort((a, b) => a.label.localeCompare(b.label))
})

// Get quarters that don't have availability configured yet
const unconfiguredQuarters = computed(() => {
  const configuredIds = Object.keys(formData.value.quarterAvailability)
  return quartersStore.quarters
    .filter(q => !configuredIds.includes(q.id))
    .sort((a, b) => a.label.localeCompare(b.label))
})

// Load member data for editing
watch(() => props.memberId, (newId) => {
  if (newId) {
    const member = membersStore.getMemberById(newId)
    if (member) {
      formData.value = {
        name: member.name,
        roles: [...member.roles],
        quarterAvailability: { ...member.quarterAvailability },
      }
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// Validation rules
const nameRules = [
  (v: string) => !!v?.trim() || 'Name is required',
  (v: string) => (v?.trim()?.length ?? 0) >= 2 || 'Name must be at least 2 characters',
  (v: string) => {
    if (!v?.trim()) return true // handled by required rule
    const trimmed = v.trim().toLowerCase()
    const existing = membersStore.members.filter(m =>
      m.name.toLowerCase() === trimmed && m.id !== props.memberId
    )
    return existing.length === 0 || 'A member with this name already exists'
  },
]

const roleRules = [
  (v: string[]) => (v?.length ?? 0) > 0 || 'At least one role is required',
]

const quarterAvailabilityRules = [
  (v: number | string) => {
    if (v === undefined || v === null || v === '' || v === '') return true
    const num = Number(v)
    return (!isNaN(num) && num >= 0) || 'Availability must be a positive number'
  },
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
    quarterAvailability: {},
  }
  formRef.value?.resetValidation()
}

// Add quarter availability
function addQuarterAvailability() {
  if (selectedNewQuarter.value) {
    formData.value.quarterAvailability[selectedNewQuarter.value.id] = 10
    selectedNewQuarter.value = null
    showAddQuarterDialog.value = false
  }
}

// Remove quarter availability
function removeQuarterAvailability(quarterId: string) {
  delete formData.value.quarterAvailability[quarterId]
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
        quarterAvailability: { ...formData.value.quarterAvailability },
      })
      member = membersStore.getMemberById(props.memberId)!
    } else {
      // Create new member
      member = membersStore.addMember({
        name: formData.value.name.trim(),
        roles: formData.value.roles,
        quarterAvailability: { ...formData.value.quarterAvailability },
      })
    }

    emit('submit', member)
    resetForm()
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.quarter-availability-card {
  max-height: 300px;
  overflow-y: auto;
}
</style>
