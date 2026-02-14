<template>
  <div
    class="assignment-cell"
    :class="[
      `role-${roleClass}`,
      { 'carryover-cell': isCarryover }
    ]"
    draggable="true"
    @click="$emit('click')"
  >
    <div class="cell-content">
      <span class="member-name">{{ member?.name || 'Unknown' }}</span>
      <span class="role-badge">{{ assignment.role }}</span>
    </div>
    <v-icon v-if="isCarryover" size="x-small" class="carryover-icon">
      mdi-arrow-right-bold
    </v-icon>
  </div>
</template>

<script setup lang="ts">
import type { Assignment, TeamMember } from '~/types'

const props = defineProps<{
  assignment: Assignment
  member: TeamMember | undefined
  isCarryover: boolean
}>()

defineEmits<{
  click: []
}>()

const roleClass = computed(() => {
  const role = props.assignment.role.toLowerCase()
  return role.replace(/[^a-z]/g, '')
})

const roleColors: Record<string, { bg: string; text: string }> = {
  be: { bg: '#E3F2FD', text: '#1565C0' },
  fe: { bg: '#E8F5E9', text: '#2E7D32' },
  mobile: { bg: '#FFF3E0', text: '#E65100' },
  qa: { bg: '#F3E5F5', text: '#7B1FA2' },
}

const cellStyle = computed(() => {
  const role = props.assignment.role.toLowerCase()
  const colors = roleColors[role] || { bg: '#F5F5F5', text: '#424242' }
  return {
    backgroundColor: colors.bg,
    color: colors.text,
  }
})
</script>

<style scoped>
.assignment-cell {
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.assignment-cell:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.role-be {
  background-color: #E3F2FD;
  color: #1565C0;
}

.role-fe {
  background-color: #E8F5E9;
  color: #2E7D32;
}

.role-mobile {
  background-color: #FFF3E0;
  color: #E65100;
}

.role-qa {
  background-color: #F3E5F5;
  color: #7B1FA2;
}

.carryover-cell {
  border: 2px dashed #FFC107;
  background-color: #FFFDE7;
}

.cell-content {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
  min-width: 0;
}

.member-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.role-badge {
  font-size: 0.65rem;
  text-transform: uppercase;
  opacity: 0.8;
}

.carryover-icon {
  color: #FF8F00;
}
</style>
