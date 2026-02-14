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
        <div class="text-subtitle-2 font-weight-medium">
          {{ initiative.name }}
        </div>
        <div class="d-flex flex-wrap ga-1 mt-1">
          <v-chip
            v-for="req in initiative.roleRequirements"
            :key="req.role"
            :color="getRoleColor(req.role)"
            size="x-small"
            variant="tonal"
          >
            {{ req.role }}: {{ req.effort }}w
          </v-chip>
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
      :class="{ 'carryover-week': week > (quarter?.totalWeeks || 13) - 2 }"
    >
      <div class="assignments-container">
        <AssignmentCell
          v-for="(assignment, index) in getAssignmentsForWeek(week)"
          :key="index"
          :assignment="assignment"
          :member="getMember(assignment.memberId)"
          :is-carryover="isAssignmentCarryover(assignment, week)"
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
import { ref } from 'vue'
import type { Initiative, QuarterConfig, TeamMember, Assignment } from '~/types'
import { checkCarryOver } from '~/utils/capacityCalculator'
import AssignmentCell from './AssignmentCell.vue'

const props = defineProps<{
  initiative: Initiative
  quarter: QuarterConfig | undefined
  members: TeamMember[]
  draggedMember: TeamMember | null
}>()

const emit = defineEmits<{
  'edit-assignment': [payload: { initiative: Initiative; assignmentIndex: number }]
  'add-assignment': [initiative: Initiative]
  'drop-member': [payload: { initiative: Initiative; memberId: string; role: string }]
}>()

// Drag over state
const isDragOver = ref(false)

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

// Drag and drop handlers
function handleDragOver(event: DragEvent) {
  if (props.draggedMember) {
    isDragOver.value = true
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
  }
}

function handleDragLeave() {
  isDragOver.value = false
}

function handleDrop(event: DragEvent) {
  isDragOver.value = false

  if (!props.draggedMember) return

  // Find a matching role requirement
  const memberRoles = props.draggedMember.roles
  const matchingRequirement = props.initiative.roleRequirements.find(
    (req) => memberRoles.includes(req.role)
  )

  if (matchingRequirement) {
    emit('drop-member', {
      initiative: props.initiative,
      memberId: props.draggedMember.id,
      role: matchingRequirement.role,
    })
  } else if (props.initiative.roleRequirements.length > 0) {
    // Use first role requirement if no match
    emit('drop-member', {
      initiative: props.initiative,
      memberId: props.draggedMember.id,
      role: props.initiative.roleRequirements[0].role,
    })
  }
}

function handleAssignmentDragStart(event: DragEvent, assignment: Assignment) {
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
  background-color: #fafafa;
}

.board-row.drag-over {
  background-color: #e3f2fd !important;
}

.initiative-cell {
  position: sticky;
  left: 0;
  background: white;
  z-index: 1;
  border-right: 1px solid #e0e0e0;
}

.week-cell {
  min-width: 60px;
  vertical-align: top;
}

.carryover-week {
  background-color: #fffde7;
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
  background: white;
  z-index: 1;
  border-left: 1px solid #e0e0e0;
}

.drop-zone-indicator {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background-color: #e3f2fd;
  border-radius: 4px;
  border: 1px dashed #1976d2;
}
</style>
