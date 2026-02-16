<template>
  <div
    ref="cellRef"
    class="assignment-cell"
    :class="[
      `role-${roleClass}`,
      { 'carryover-cell': isCarryover, 'dragging': isDragging }
    ]"
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
import { ref, computed } from 'vue'
import type { Assignment, TeamMember } from '~/types'

const props = defineProps<{
  assignment: Assignment
  member: TeamMember | undefined
  isCarryover: boolean
  isDragging?: boolean
}>()

defineEmits<{
  click: []
}>()

const cellRef = ref<HTMLDivElement | null>(null)

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

defineExpose({
  cellRef,
})
</script>

<style scoped>
.assignment-cell {
  padding: 4px 8px;
  border-radius: 4px;
  cursor: grab;
  font-size: 0.75rem;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.assignment-cell:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.assignment-cell.dragging {
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  opacity: 0.9;
  z-index: 1000;
  cursor: grabbing;
}

.role-be {
  background-color: var(--color-be-bg);
  color: var(--color-be);
}

.role-fe {
  background-color: var(--color-fe-bg);
  color: var(--color-fe);
}

.role-mobile {
  background-color: var(--color-mobile-bg);
  color: var(--color-mobile);
}

.role-qa {
  background-color: var(--color-qa-bg);
  color: var(--color-qa);
}

.carryover-cell {
  border: 2px dashed var(--color-carryover);
  background-color: var(--color-carryover-bg);
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
  color: var(--color-carryover);
}
</style>
