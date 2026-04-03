<template>
  <v-card
    class="member-card"
    elevation="2"
    hover
    data-testid="member-card"
    :class="{ 'cursor-pointer': !editMode }"
    @click="!editMode && $emit('click', member.id)"
  >
    <v-card-text>
      <div class="d-flex align-center mb-3">
        <!-- Avatar with initials -->
        <v-avatar
          :color="avatarColor"
          size="56"
          class="mr-3"
        >
          <span class="text-h5 font-weight-bold">{{ initials }}</span>
        </v-avatar>

        <!-- Name and actions -->
        <div class="flex-grow-1">
          <h3 class="text-h6 mb-0">{{ member.name }}</h3>
          <div class="text-caption text-grey-darken-1">{{ member.id }}</div>
        </div>

        <!-- Action buttons -->
        <div v-if="editMode" class="d-flex gap-1" @click.stop>
          <v-btn
            icon="mdi-cog"
            size="small"
            variant="text"
            color="secondary"
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
      <div class="mb-3">
        <div class="text-caption text-grey-darken-1 mb-1">Roles</div>
        <div class="d-flex flex-wrap gap-1">
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
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon icon="mdi-calendar-clock" size="small" class="mr-1" />
            <span class="text-caption text-grey-darken-1">Quarter Availability</span>
          </div>
        </div>
        <div class="d-flex flex-wrap gap-1 mt-1">
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
          <v-chip 
            v-if="Object.keys(member.quarterAvailability).length === 0" 
            size="small" 
            label 
            disabled
          >
            No quarters configured
          </v-chip>
        </div>
      </div>

      <!-- Assignments -->
      <v-row class="text-caption mt-2">
        <v-col cols="12">
          <div class="d-flex align-center">
            <v-icon icon="mdi-briefcase-outline" size="small" class="mr-1" />
            <span class="text-grey-darken-1">Assigned:</span>
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
import type { TeamMember } from '~/types'
import { getInitials, stringToColor } from '~/utils/colorUtils'
import { useRolesStore } from '~/stores/roles'

interface Props {
  member: TeamMember
  editMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editMode: false,
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
