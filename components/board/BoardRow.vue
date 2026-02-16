<template>
  <tr
    class="board-row"
    :class="{ 'drag-over': isDragOver }"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <!-- Initiative name cell -->
    <td class="initiative-cell">
      <div class="d-flex flex-column">
        <div class="d-flex align-center">
          <div class="text-subtitle-2 font-weight-medium">
            {{ initiative.name }}
          </div>
          <v-tooltip
            v-if="warnings.hasWarnings"
            location="top"
            :max-width="300"
          >
            <template #activator="{ props: tooltipProps }">
              <v-chip
                v-bind="tooltipProps"
                size="x-small"
                color="warning"
                variant="tonal"
                class="ml-2"
              >
                <v-icon start size="small">mdi-alert</v-icon>
                {{ warnings.overCapacityMembers.length + warnings.unfilledRoles.length + warnings.weekConflicts.length }}
              </v-chip>
            </template>
            <div class="warning-tooltip">
              <div v-if="warnings.overCapacityMembers.length > 0" class="mb-2">
                <strong>Over-capacity members:</strong>
                <ul class="my-1">
                  <li v-for="member in warnings.overCapacityMembers" :key="member">
                    {{ member }}
                  </li>
                </ul>
              </div>
              <div v-if="warnings.unfilledRoles.length > 0" class="mb-2">
                <strong>Unfilled roles:</strong>
                <ul class="my-1">
                  <li v-for="role in warnings.unfilledRoles" :key="role.role">
                    {{ role.role }}: {{ role.assigned }}/{{ role.required }}w
                  </li>
                </ul>
              </div>
              <div v-if="warnings.weekConflicts.length > 0">
                <strong>Week conflicts:</strong>
                <ul class="my-1">
                  <li v-for="conflict in warnings.weekConflicts" :key="conflict.memberId">
                    {{ conflict.memberName }}:
                    <div v-for="c in conflict.conflicts" :key="c" class="text-caption">
                      {{ c }}
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </v-tooltip>
        </div>
        <div class="d-flex flex-wrap ga-1 mt-1">
          <div
            v-for="fulfillment in roleFulfillment"
            :key="fulfillment.role"
            class="role-fulfillment"
          >
            <v-chip
              :color="getRoleColor(fulfillment.role)"
              size="x-small"
              variant="tonal"
            >
              {{ fulfillment.role }}
            </v-chip>
            <v-progress-linear
              :model-value="fulfillment.percentage"
              :color="getProgressColor(fulfillment.percentage)"
              height="4"
              rounded
              class="role-progress"
            />
            <span class="text-caption role-progress-text">
              {{ fulfillment.assigned }}/{{ fulfillment.required }}w
            </span>
          </div>
        </div>
        <v-chip
          v-if="initiative.carriesOverTo"
          size="x-small"
          color="warning"
          variant="outlined"
          class="mt-1"
          style="width: fit-content"
        >
          <v-icon start size="small">mdi-arrow-right</v-icon>
          Carries to {{ initiative.carriesOverTo }}
        </v-chip>
        <!-- Drop zone indicator -->
        <div v-if="isDragOver" class="drop-zone-indicator mt-2">
          <v-icon size="small" color="primary">mdi-plus-circle</v-icon>
          <span class="text-caption text-primary ml-1">Drop to assign</span>
        </div>
      </div>
    </td>

    <!-- Week cells -->
    <td
      v-for="week in quarter?.totalWeeks || 13"
      :key="week"
      class="week-cell"
      :class="{
        'carryover-week': week > (quarter?.totalWeeks || 13) - 2,
        'drag-over-week': isDragOverWeek === week
      }"
      @dragover.prevent="handleWeekDragOver($event, week)"
      @dragleave="handleWeekDragLeave"
      @drop.prevent="handleWeekDrop($event, week)"
    >
      <div class="assignments-container">
        <AssignmentCell
          v-for="(assignment, index) in getAssignmentsForWeek(week)"
          :key="index"
          :assignment="assignment"
          :member="getMember(assignment.memberId)"
          :is-carryover="isAssignmentCarryover(assignment, week)"
          :is-dragging="isDragging && dragState?.type === 'assignment' && (dragState?.data as Assignment)?.memberId === assignment.memberId && (dragState?.data as Assignment)?.startWeek === assignment.startWeek"
          draggable="true"
          @click="$emit('edit-assignment', { initiative, assignmentIndex: getAssignmentIndex(assignment) })"
          @dragstart="handleAssignmentDragStart($event, assignment)"
        />
      </div>
    </td>

    <!-- Actions cell -->
    <td class="actions-cell">
      <v-btn
        icon="mdi-plus"
        size="small"
        variant="text"
        color="primary"
        data-testid="add-assignment-btn"
        @click="$emit('add-assignment', initiative)"
      />
    </td>
  </tr>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Initiative, QuarterConfig, TeamMember, Assignment } from '~/types'
import { checkCarryOver, getInitiativeWarnings, getRoleFulfillment } from '~/utils/capacityCalculator'
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

// Use the board drag and drop composable
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

// Computed drag over state using the composable
const isDragOver = computed(() => {
  if (!isDragging.value) return false
  // Show drag over if dragging a member
  return dragState.value?.type === 'member' && props.draggedMember !== null
})

const isDragOverWeek = computed(() => {
  if (!isDragging.value || !dropTarget.value) return null
  // Only show week drag over if this is the target
  if (isDropTarget(props.initiative.id, dropTarget.value.week)) {
    return dropTarget.value.week
  }
  return null
})

// Computed warnings
const warnings = computed(() =>
  getInitiativeWarnings(props.initiative, props.members, props.allInitiatives, props.quarter?.id || '')
)

// Computed role fulfillment
const roleFulfillment = computed(() => getRoleFulfillment(props.initiative))

// Role color mapping
const roleColors: Record<string, string> = {
  BE: 'blue',
  FE: 'green',
  MOBILE: 'orange',
  QA: 'purple',
}

function getRoleColor(role: string): string {
  return roleColors[role.toUpperCase()] || 'grey'
}

function getProgressColor(percentage: number): string {
  if (percentage >= 100) return 'success'
  if (percentage >= 75) return 'info'
  if (percentage >= 50) return 'warning'
  return 'error'
}

function getMember(memberId: string): TeamMember | undefined {
  return props.members.find((m) => m.id === memberId)
}

function getAssignmentsForWeek(weekNumber: number): Assignment[] {
  return props.initiative.assignments.filter((assignment) => {
    const endWeek = assignment.startWeek + assignment.weeksAllocated - 1
    return weekNumber >= assignment.startWeek && weekNumber <= endWeek
  })
}

function isAssignmentCarryover(assignment: Assignment, currentWeek: number): boolean {
  if (!props.quarter) return false
  const carryOverInfo = checkCarryOver(assignment, props.quarter)
  return carryOverInfo.carriesOver && currentWeek > props.quarter.totalWeeks - carryOverInfo.carriedWeeks
}

function getAssignmentIndex(assignment: Assignment): number {
  return props.initiative.assignments.findIndex((a) => a === assignment)
}

// Drag and drop handlers for the row
function handleDragOver(event: DragEvent) {
  if (props.draggedMember) {
    // isDragOver is now computed, no need to manually set it
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
  }
}

function handleDragLeave() {
  // isDragOver is now computed, no need to manually clear it
}

function handleDrop(event: DragEvent) {
  // isDragOver is now computed, no need to manually clear it

  if (!props.draggedMember) return

  // Find a matching role requirement
  const memberRoles = props.draggedMember.roles
  const matchingRequirement = props.initiative.roleRequirements.find(
    (req) => memberRoles.includes(req.role)
  )

  const startWeek = 1 // Default to first week when dropping on the row

  if (matchingRequirement) {
    emit('drop-member', {
      initiative: props.initiative,
      memberId: props.draggedMember.id,
      role: matchingRequirement.role,
      startWeek,
    })
  } else if (props.initiative.roleRequirements.length > 0) {
    // Use first role requirement if no match
    emit('drop-member', {
      initiative: props.initiative,
      memberId: props.draggedMember.id,
      role: props.initiative.roleRequirements[0].role,
      startWeek,
    })
  }
}

// Week-specific drag handlers using the composable
function handleWeekDragOver(event: DragEvent, week: number) {
  if (props.draggedMember) {
    setDropTarget(props.initiative.id, week)
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
  }
}

function handleWeekDragLeave() {
  // Clear the drop target when leaving the cell
  setDropTarget(props.initiative.id, null)
}

function handleWeekDrop(event: DragEvent, week: number) {
  // Use the composable's handleDropOnWeek method
  const success = handleDropOnWeek(props.initiative, week)

  // Clear the drop target
  setDropTarget(props.initiative.id, null)

  // If the composable successfully handled the drop, we're done
  if (success) return

  // Otherwise, fall back to emitting the event for backward compatibility
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
}

function handleAssignmentDragStart(event: DragEvent, assignment: Assignment) {
  // Use the composable's startAssignmentDrag to track the drag state
  const week = assignment.startWeek
  startAssignmentDrag(assignment, props.initiative.id, week)

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'assignment',
      initiativeId: props.initiative.id,
      assignment,
    }))
  }
}
</script>

<style scoped>
.board-row {
  transition: background-color 0.2s ease;
}

.board-row:hover {
  background-color: rgb(var(--v-theme-surface-variant));
}

.board-row.drag-over {
  background-color: rgb(var(--v-theme-primary-lighten-5)) !important;
}

.initiative-cell {
  position: sticky;
  left: 0;
  background: rgb(var(--v-theme-surface));
  z-index: 1;
  border-right: 1px solid rgb(var(--v-theme-border));
}

.week-cell {
  min-width: 60px;
  vertical-align: top;
  transition: background-color 0.15s ease;
}

.week-cell.drag-over-week {
  background-color: rgb(var(--v-theme-primary-lighten-4)) !important;
  outline: 2px dashed rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

.carryover-week {
  background-color: var(--color-carryover-bg);
}

.assignments-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 30px;
}

.actions-cell {
  position: sticky;
  right: 0;
  background: rgb(var(--v-theme-surface));
  z-index: 1;
  border-left: 1px solid rgb(var(--v-theme-border));
}

.drop-zone-indicator {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background-color: rgb(var(--v-theme-primary-lighten-5));
  border-radius: 4px;
  border: 1px dashed rgb(var(--v-theme-primary));
}

.role-fulfillment {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 80px;
}

.role-progress {
  flex: 1;
  min-width: 40px;
  max-width: 60px;
}

.role-progress-text {
  min-width: 45px;
  font-size: 0.7rem;
}

.warning-tooltip ul {
  padding-left: 1.2rem;
  margin: 0;
}
</style>
