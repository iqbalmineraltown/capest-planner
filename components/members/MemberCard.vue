<template>
  <v-card
    class="member-card"
    elevation="2"
    hover
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
            icon="mdi-pencil"
            size="small"
            variant="text"
            color="primary"
            @click="$emit('edit', member.id)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
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

      <!-- Availability and assignments -->
      <v-row class="text-caption">
        <v-col cols="6">
          <div class="d-flex align-center">
            <v-icon icon="mdi-clock-outline" size="small" class="mr-1" />
            <span class="text-grey-darken-1">Availability:</span>
          </div>
          <div class="text-h6 font-weight-bold ml-6">
            {{ member.availability }} <span class="text-caption font-weight-regular">manweeks</span>
          </div>
        </v-col>
        <v-col cols="6">
          <div class="d-flex align-center">
            <v-icon icon="mdi-briefcase-outline" size="small" class="mr-1" />
            <span class="text-grey-darken-1">Assigned:</span>
          </div>
          <div class="text-h6 font-weight-bold ml-6">
            {{ member.assignedInitiatives.length }} <span class="text-caption font-weight-regular">initiatives</span>
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

// Generate avatar color from name
const avatarColor = computed(() => stringToColor(props.member.name))

// Get initials from name
const initials = computed(() => getInitials(props.member.name))

// Get color for role chips
function getRoleColor(role: string): string {
  const roleColors: Record<string, string> = {
    BE: 'blue',
    FE: 'green',
    MOBILE: 'purple',
    QA: 'orange',
  }

  return roleColors[role] || stringToColor(role)
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
