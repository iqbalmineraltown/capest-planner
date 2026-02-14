<template>
  <tr class="board-row">
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
          @click="$emit('edit-assignment', { initiative, assignmentIndex: getAssignmentIndex(assignment) })"
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
        @click="$emit('add-assignment', initiative)"
      />
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { Initiative, QuarterConfig, TeamMember, Assignment } from '~/types'
import { checkCarryOver } from '~/utils/capacityCalculator'
import AssignmentCell from './AssignmentCell.vue'

const props = defineProps<{
  initiative: Initiative
  quarter: QuarterConfig | undefined
  members: TeamMember[]
}>()

defineEmits<{
  'edit-assignment': [payload: { initiative: Initiative; assignmentIndex: number }]
  'add-assignment': [initiative: Initiative]
}>()

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
</script>

<style scoped>
.board-row:hover {
  background-color: #fafafa;
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
</style>
