<template>
  <v-card
    class="member-card rounded-xl"
    elevation="2"
    hover
    data-testid="member-card"
    :class="{ 'cursor-pointer': !editMode }"
    @click="!editMode && $emit('click', member.id)"
  >
    <v-card-text class="py-4">
      <div class="d-flex align-center mb-4">
        <!-- Avatar with initials -->
        <v-avatar
          :color="avatarColor"
          size="64"
          class="mr-4"
        >
          <span class="text-h4 font-weight-bold">{{ initials }}</span>
        </v-avatar>

        <!-- Name and actions -->
        <div class="flex-grow-1">
          <h3 class="text-h5 font-weight-bold mb-1">{{ member.name }}</h3>
          <div class="text-caption text--secondary">{{ member.id }}</div>
        </div>

        <!-- Action buttons -->
        <div v-if="editMode" class="d-flex gap-2" @click.stop>
          <v-btn
            icon="mdi-cog"
            size="small"
            variant="text"
            color="primary"
            data-testid="settings-member-btn"
            @click="$emit('edit', member.id)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            data-testid="delete-member-btn"
            @click="$emit('delete', member.id)"
          />
        </div>
      </div>

      <!-- Role chips -->
      <div class="mb-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-caption font-weight-bold text--secondary">Roles</span>
          <v-chip
            v-if="hasConflicts"
            color="error"
            size="mini"
            label
            small
          >
            Conflict
          </v-chip>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <v-chip
            v-for="role in member.roles"
            :key="role"
            :color="getRoleColor(role)"
            size="small"
            label
          >
            {{ role }}
          </v-chip>
          <v-chip v-if="member.roles.length === 0" size="small" label disabled>
            No roles assigned
          </v-chip>
        </div>
      </div>

      <!-- Quarter Availability -->
      <div class="mb-2">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="d-flex align-center">
            <v-icon icon="mdi-calendar-clock" size="small" class="mr-1" />
            <span class="text-caption font-weight-bold text--secondary">Quarter Availability</span>
          </div>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <v-chip
            v-for="(weeks, quarterId) in member.quarterAvailability"
            :key="quarterId"
            size="small"
            :color="weeks > 0 ? 'primary' : 'default'"
            variant="tonal"
            label
          >
            {{ quarterId }}: {{ weeks }}w
          </v-chip>
          <v-chip v-if="Object.keys(member.quarterAvailability).length === 0" size="small" label disabled>
            No quarters configured
          </v-chip>
        </div>
      </div>

      <!-- Assignments -->
      <v-row class="text-caption mt-2">
        <v-col cols="12">
          <div class="d-flex align-center">
            <v-icon icon="mdi-briefcase-outline" size="small" class="mr-1" />
            <span class="text-caption text--secondary">Assigned:</span>
            <span class="font-weight-bold ml-2">
              {{ member.assignedInitiatives.length }} initiatives
            </span>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TeamMember, Initiative } from '~/types'
import { getInitials, stringToColor } from '~/utils/colorUtils'
import { getMemberWeekConflicts } from '~/utils/capacityCalculator'
import { useRolesStore } from '~/stores/roles'

interface Props {
  member: TeamMember
  editMode?: boolean
  initiatives?: Initiative[]
  quarterId?: string
}

const props = withDefaults(defineProps<Props>(), {
  editMode: false,
  initiatives: () => [],
  quarterId: '',
})

defineEmits<{
  click: [id: string]
  edit: [id: string]
  delete: [id: string]
}>()

const rolesStore = useRolesStore()

// Generate avatar color from name
const avatarColor = computed(() => stringToColor(props.member.name))

// Get initials from name
const initials = computed(() => getInitials(props.member.name))

// Get color for role chips
function getRoleColor(role: string): string {
  return rolesStore.getRoleColor(role) || stringToColor(role)
}

// Get week conflicts for this member
const weekConflicts = computed(() => {
  if (!props.quarterId || !props.initiatives?.length) return []
  return getMemberWeekConflicts(props.member.id, props.initiatives, props.quarterId)
})

// Check if member has any conflicts
const hasConflicts = computed(() => weekConflicts.value.length > 0)
</script>

<style scoped>
.member-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.member-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.cursor-pointer {
  cursor: pointer;
}

.gap-1 {
  gap: 4px;
}
</style>
