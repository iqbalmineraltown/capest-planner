<template>
  <div class="board-swimlane" :class="{ 'board-swimlane--drag-active': isDragging }">
    <!-- Swimlane Header (no collapse toggle) -->
    <div class="swimlane-header">
      <div class="swimlane-header__left">
        <span class="swimlane-header__title">{{ initiative.name }}</span>

        <!-- Warning badge -->
        <v-tooltip v-if="warnings.hasWarnings" location="top" :max-width="300">
          <template #activator="{ props: tp }">
            <v-chip
              v-bind="tp"
              size="x-small"
              color="warning"
              variant="flat"
              class="swimlane-header__badge"
            >
              <v-icon start size="12">mdi-alert</v-icon>
              {{ warningCount }}
            </v-chip>
          </template>
          <div class="swimlane-tooltip">
            <div v-if="warnings.overCapacityMembers.length" class="mb-1">
              <strong>Over-capacity:</strong>
              <span v-for="m in warnings.overCapacityMembers" :key="m" class="d-block text-caption">• {{ m }}</span>
            </div>
            <div v-if="warnings.unfilledRoles.length" class="mb-1">
              <strong>Unfilled roles:</strong>
              <span v-for="r in warnings.unfilledRoles" :key="r.role" class="d-block text-caption">
                • {{ r.role }}: {{ r.assigned }}/{{ r.required }}w
              </span>
            </div>
          </div>
        </v-tooltip>

        <!-- Carryover indicator -->
        <v-chip
          v-if="initiative.carriesOverTo"
          size="x-small"
          color="warning"
          variant="outlined"
          class="ml-2"
        >
          <v-icon start size="12">mdi-arrow-right</v-icon>
          → {{ initiative.carriesOverTo }}
        </v-chip>
      </div>

      <!-- Role fulfillment pills -->
      <div class="swimlane-header__roles">
        <v-tooltip
          v-for="f in roleFulfillment"
          :key="f.role"
          location="top"
          :open-delay="300"
        >
          <template #activator="{ props: rp }">
            <div
              v-bind="rp"
              class="role-pill"
              :style="{ '--role-color': getRoleHex(f.role) }"
            >
              <span class="role-pill__label">{{ f.role }}</span>
              <span class="role-pill__value">{{ f.assigned }}/{{ f.required }}w</span>
              <div class="role-pill__bar">
                <div
                  class="role-pill__fill"
                  :style="{ width: Math.min(100, f.percentage) + '%' }"
                />
              </div>
            </div>
          </template>
          {{ f.role }}: {{ f.assigned }} of {{ f.required }} weeks assigned ({{ Math.round(f.percentage) }}%)
        </v-tooltip>
      </div>

      <!-- Add assignment button -->
      <v-btn
        icon
        size="small"
        variant="text"
        color="primary"
        class="swimlane-header__add"
        data-testid="add-assignment-btn"
        @click.stop="$emit('add-assignment', initiative)"
      >
        <v-icon size="20">mdi-plus</v-icon>
      </v-btn>
    </div>

    <!-- Week columns (kanban) - always visible, no collapse -->
    <div class="swimlane-board">
      <!-- Week column headers (inside swimlane for alignment) -->
      <div class="swimlane-weeks">
        <div
          v-for="week in totalWeeks"
          :key="week"
          class="week-column"
          :class="{
            'week-column--drop-target': isDropTargetWeek(week),
            'week-column--carryover': week > totalWeeks - 2,
          }"
          @dragenter="handleWeekDragEnter($event, week)"
          @dragover="handleWeekDragOver($event, week)"
          @dragleave="handleWeekDragLeave($event, week)"
          @drop="handleWeekDrop($event, week)"
        >
          <!-- Week label inside column -->
          <div class="week-column__label">W{{ week }}</div>

          <!-- Drop placeholder -->
          <div v-if="isDropTargetWeek(week)" class="week-column__drop-placeholder">
            <v-icon size="16" color="primary">mdi-plus-circle</v-icon>
            <span class="week-column__drop-text">Drop here</span>
          </div>

          <!-- Assignment cards -->
          <AssignmentCell
            v-for="(assignment, idx) in getAssignmentsForWeek(week)"
            :key="`${assignment.memberId}-${assignment.startWeek}-${idx}`"
            :assignment="assignment"
            :member="getMember(assignment.memberId)"
            :is-carryover="isAssignmentCarryover(assignment, week)"
            :is-dragging="isCardDragging(assignment)"
            draggable="true"
            @click="$emit('edit-assignment', { initiative, assignmentIndex: getAssignmentIndex(assignment) })"
            @dragstart="handleAssignmentDragStart($event, assignment)"
            @dragend="handleDragEnd"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Initiative, QuarterConfig, TeamMember, Assignment } from '~/types'
import { checkCarryOver, getInitiativeWarnings, getRoleFulfillment } from '~/utils/capacityCalculator'
import { getRoleHex } from '~/utils/colorUtils'
import { useBoardDragDrop } from '~/composables/useBoardDragDrop'
import AssignmentCell from './AssignmentCell.vue'

const props = defineProps<{
  initiative: Initiative
  quarter: QuarterConfig | undefined
  members: TeamMember[]
  draggedMember: TeamMember | null
  allInitiatives: Initiative[]
}>()

const emit = defineEmits<{
  'edit-assignment': [payload: { initiative: Initiative; assignmentIndex: number }]
  'add-assignment': [initiative: Initiative]
  'drop-member': [payload: { initiative: Initiative; memberId: string; role: string; startWeek: number }]
}>()

const {
  dragState,
  dropTarget,
  isDragging,
  startAssignmentDrag,
  setDropTarget,
  isDropTarget,
  handleDropOnWeek,
  endDrag,
  getDropRole,
} = useBoardDragDrop()

const totalWeeks = computed(() => props.quarter?.totalWeeks || 13)

// Counter to fix HTML5 dragleave flicker on child elements
const weekDragCounters = ref<Record<number, number>>({})

// ─── Warnings & Fulfillment ────────────────────────────────
const warnings = computed(() =>
  getInitiativeWarnings(props.initiative, props.members, props.allInitiatives, props.quarter?.id || '')
)
const warningCount = computed(() =>
  warnings.value.overCapacityMembers.length +
  warnings.value.unfilledRoles.length +
  warnings.value.weekConflicts.length
)
const roleFulfillment = computed(() => getRoleFulfillment(props.initiative))

// ─── Helpers ────────────────────────────────────────────────
function getMember(memberId: string): TeamMember | undefined {
  return props.members.find((m) => m.id === memberId)
}

function getAssignmentsForWeek(weekNumber: number): Assignment[] {
  return props.initiative.assignments.filter((a) => {
    const endWeek = a.startWeek + a.weeksAllocated - 1
    return weekNumber >= a.startWeek && weekNumber <= endWeek
  })
}

function isAssignmentCarryover(assignment: Assignment, currentWeek: number): boolean {
  if (!props.quarter) return false
  const info = checkCarryOver(assignment, props.quarter)
  return info.carriesOver && currentWeek > props.quarter.totalWeeks - info.carriedWeeks
}

function getAssignmentIndex(assignment: Assignment): number {
  return props.initiative.assignments.findIndex((a) => a === assignment)
}

function isCardDragging(assignment: Assignment): boolean {
  if (!isDragging.value || dragState.value?.type !== 'assignment') return false
  const d = dragState.value.data as Assignment
  return d.memberId === assignment.memberId && d.startWeek === assignment.startWeek
}

// ─── Drop target tracking ───────────────────────────────────
function isDropTargetWeek(week: number): boolean {
  if (!isDragging.value) return false
  return isDropTarget(props.initiative.id, week)
}

// ─── DnD Handlers ───────────────────────────────────────────
// Uses enter/leave counter pattern to prevent flicker when
// hovering over child elements inside a week column.
function handleWeekDragEnter(event: DragEvent, week: number) {
  event.preventDefault()
  if (!weekDragCounters.value[week]) weekDragCounters.value[week] = 0
  weekDragCounters.value[week]++

  if (weekDragCounters.value[week] === 1) {
    setDropTarget(props.initiative.id, week)
  }
  if (event.dataTransfer) {
    // Use 'move' for assignments, 'copy' for members — must match effectAllowed
    event.dataTransfer.dropEffect = dragState.value?.type === 'assignment' ? 'move' : 'copy'
  }
}

function handleWeekDragOver(event: DragEvent, _week: number) {
  // Always preventDefault on dragover to allow drops
  // Without this, the browser will not fire the 'drop' event
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = dragState.value?.type === 'assignment' ? 'move' : 'copy'
  }
}

function handleWeekDragLeave(_event: DragEvent, week: number) {
  if (!weekDragCounters.value[week]) weekDragCounters.value[week] = 0
  weekDragCounters.value[week]--

  if (weekDragCounters.value[week] <= 0) {
    weekDragCounters.value[week] = 0
    setDropTarget(props.initiative.id, null as unknown as number)
  }
}

function handleWeekDrop(event: DragEvent, week: number) {
  // Must preventDefault to complete the drop
  event.preventDefault()

  // Reset counter for this column
  weekDragCounters.value[week] = 0
  setDropTarget(props.initiative.id, null as unknown as number)

  // The composable handles both member and assignment drops
  const success = handleDropOnWeek(props.initiative, week)
  if (success) {
    endDrag()
    return
  }

  // Fallback for member drops that the composable couldn't handle
  if (!props.draggedMember) return
  const role = getDropRole(props.draggedMember, props.initiative)
  if (role) {
    emit('drop-member', {
      initiative: props.initiative,
      memberId: props.draggedMember.id,
      role,
      startWeek: week,
    })
  }
  endDrag()
}

function handleAssignmentDragStart(event: DragEvent, assignment: Assignment) {
  startAssignmentDrag(assignment, props.initiative.id, assignment.startWeek)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'assignment',
      initiativeId: props.initiative.id,
      assignment,
    }))
  }
}

function handleDragEnd() {
  endDrag()
}
</script>

<style scoped>
.board-swimlane {
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 12px;
  border: 1px solid rgb(var(--v-theme-border));
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.board-swimlane + .board-swimlane {
  margin-top: 12px;
}

/* ─── Header ──────────────────────────────────────────────── */
.swimlane-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgb(var(--v-theme-border));
  user-select: none;
  transition: background 0.15s ease;
}

.swimlane-header:hover {
  background: rgb(var(--v-theme-surface-variant));
}

.swimlane-header__left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  min-width: 200px;
}

.swimlane-header__title {
  font-size: 0.95rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
}

.swimlane-header__badge {
  font-weight: 600;
}

.swimlane-header__roles {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  overflow-x: auto;
  padding: 0 8px;
}

.swimlane-header__add {
  flex-shrink: 0;
}

/* ─── Role pills ──────────────────────────────────────────── */
.role-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: color-mix(in srgb, var(--role-color) 8%, transparent);
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

.role-pill__label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--role-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-pill__value {
  font-size: 0.7rem;
  color: rgb(var(--v-theme-on-surface), 0.6);
  font-weight: 500;
}

.role-pill__bar {
  width: 40px;
  height: 4px;
  background: rgb(var(--v-theme-border));
  border-radius: 2px;
  overflow: hidden;
}

.role-pill__fill {
  height: 100%;
  background: var(--role-color);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* ─── Week columns board ──────────────────────────────────── */
.swimlane-board {
  padding: 8px;
  overflow-x: auto;
  scroll-behavior: smooth;
}

.swimlane-weeks {
  display: flex;
  gap: 6px;
  min-width: max-content;
}

.week-column {
  flex: 0 0 120px;
  min-height: 60px;
  padding: 6px;
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  border: 2px solid transparent;
}

/* When dragging anything, all week columns get a subtle "ready" state */
.board-swimlane--drag-active .week-column {
  border-color: rgba(var(--v-theme-primary), 0.15);
  background: rgb(var(--v-theme-surface-variant));
}

.week-column--drop-target {
  background: rgba(var(--v-theme-primary), 0.08);
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.15);
}

.week-column--carryover {
  background: rgba(var(--v-theme-warning), 0.06);
}

.week-column__label {
  font-size: 0.65rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface), 0.4);
  text-align: center;
  padding: 2px 0;
  line-height: 1;
  user-select: none;
}

.week-column--drop-target .week-column__label {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
}

.week-column__drop-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 4px;
  border: 2px dashed rgb(var(--v-theme-primary));
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.06);
  animation: pulse-glow 1.2s ease-in-out infinite;
}

.week-column__drop-text {
  font-size: 0.6rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  letter-spacing: 0.3px;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* ─── Responsive ────────────────────────────────────────── */
@media (max-width: 768px) {
  .swimlane-header {
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 12px;
  }

  .swimlane-header__left {
    min-width: 0;
    flex: 1 1 auto;
  }

  .swimlane-header__title {
    font-size: 0.85rem;
  }

  .swimlane-header__roles {
    padding: 0 4px;
    gap: 6px;
  }

  .role-pill {
    padding: 2px 6px;
    font-size: 0.6rem;
  }

  .week-column {
    flex: 0 0 80px;
    min-height: 50px;
    padding: 4px;
  }
}

@media (max-width: 480px) {
  .swimlane-header__left {
    min-width: 0;
  }

  .week-column {
    flex: 0 0 60px;
    min-height: 44px;
    padding: 3px;
  }

  .assignment-card__body {
    padding: 4px 6px 4px 10px;
  }

  .assignment-card__avatar {
    width: 22px;
    height: 22px;
    font-size: 0.55rem;
  }
}
</style>
