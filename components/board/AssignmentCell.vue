<template>
  <div
    class="assignment-card"
    :class="[
      `assignment-card--${roleSlug}`,
      {
        'assignment-card--carryover': isCarryover,
        'assignment-card--dragging': isDragging,
        'assignment-card--ghost': isGhost,
      },
    ]"
    @click.stop="$emit('click')"
  >
    <!-- Color accent bar -->
    <div class="assignment-card__accent" :style="{ backgroundColor: roleColor }" />

    <div class="assignment-card__body">
      <!-- Header: avatar + name -->
      <div class="assignment-card__header">
        <div
          class="assignment-card__avatar"
          :style="{ backgroundColor: roleColor + '22', color: roleColor }"
        >
          {{ initials }}
        </div>
        <div class="assignment-card__info">
          <span class="assignment-card__name">{{ member?.name || 'Unknown' }}</span>
          <span class="assignment-card__role" :style="{ color: roleColor }">{{ assignment.role }}</span>
        </div>
      </div>

      <!-- Footer: week info -->
      <div class="assignment-card__footer">
        <span class="assignment-card__weeks">
          {{ assignment.weeksAllocated }}w
        </span>
        <v-icon
          v-if="isCarryover"
          size="12"
          class="assignment-card__carryover-icon"
          color="warning"
        >
          mdi-arrow-right-bold
        </v-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Assignment, TeamMember } from '~/types'

const props = defineProps<{
  assignment: Assignment
  member: TeamMember | undefined
  isCarryover: boolean
  isDragging?: boolean
  isGhost?: boolean
}>()

defineEmits<{
  click: []
}>()

const roleSlug = computed(() => props.assignment.role.toLowerCase().replace(/[^a-z]/g, ''))

const roleColorMap: Record<string, string> = {
  be: '#1565C0',
  fe: '#2E7D32',
  mobile: '#E65100',
  qa: '#7B1FA2',
}

const roleColor = computed(() => {
  const r = props.assignment.role.toLowerCase()
  return roleColorMap[r] || '#546E7A'
})

const initials = computed(() => {
  if (!props.member) return '??'
  return props.member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})
</script>

<style scoped>
.assignment-card {
  position: relative;
  background: #fff;
  border-radius: 8px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.06);
  cursor: grab;
  user-select: none;
  overflow: hidden;
  transition:
    transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.18s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.15s ease;
  min-width: 0;
}

.assignment-card:hover {
  transform: translateY(-2px);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.12),
    0 2px 4px rgba(0, 0, 0, 0.08);
}

.assignment-card:active {
  cursor: grabbing;
  transform: translateY(-1px) scale(1.02);
}

.assignment-card--dragging {
  opacity: 0.4;
  transform: scale(0.95);
}

.assignment-card--ghost {
  opacity: 0.85;
  transform: rotate(3deg) scale(1.05);
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.2),
    0 6px 12px rgba(0, 0, 0, 0.12);
  z-index: 9999;
}

.assignment-card--carryover {
  border: 2px dashed #FFC107;
}

/* Accent bar on left */
.assignment-card__accent {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  border-radius: 8px 0 0 8px;
}

.assignment-card__body {
  padding: 8px 10px 8px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.assignment-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assignment-card__avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  flex-shrink: 0;
}

.assignment-card__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.assignment-card__name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.assignment-card__role {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1.2;
}

.assignment-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.assignment-card__weeks {
  font-size: 0.7rem;
  color: #9e9e9e;
  font-weight: 500;
}

.assignment-card__carryover-icon {
  animation: pulse-carry 1.5s ease-in-out infinite;
}

@keyframes pulse-carry {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* Dark theme support */
:root.dark .assignment-card,
.v-theme--dark .assignment-card {
  background: #1e1e2e;
}

.v-theme--dark .assignment-card__name {
  color: #e0e0e0;
}

.v-theme--dark .assignment-card__weeks {
  color: #9e9e9e;
}

.v-theme--dark .assignment-card:hover {
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
