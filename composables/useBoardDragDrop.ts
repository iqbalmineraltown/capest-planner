import { ref, computed } from 'vue'
import type { Initiative, Assignment, TeamMember, RoleType } from '~/types'
import { useInitiativesStore } from '~/stores/initiatives'

/**
 * Drag state for tracking what's being dragged
 */
export interface DragState {
  type: 'member' | 'assignment'
  data: TeamMember | Assignment
  sourceInitiativeId?: string
  sourceWeek?: number
}

// ─── Shared singleton state ─────────────────────────────────
const dragState = ref<DragState | null>(null)
const dropTarget = ref<{ initiativeId: string; week: number } | null>(null)
const isDragging = computed(() => dragState.value !== null)

/**
 * Composable for managing drag-and-drop on the capacity board.
 * Coordinates state across components via shared refs.
 */
export function useBoardDragDrop() {
  const initiativesStore = useInitiativesStore()

  function startMemberDrag(member: TeamMember) {
    dragState.value = { type: 'member', data: member }
  }

  function startAssignmentDrag(
    assignment: Assignment,
    sourceInitiativeId: string,
    sourceWeek: number
  ) {
    dragState.value = {
      type: 'assignment',
      data: assignment,
      sourceInitiativeId,
      sourceWeek,
    }
  }

  function endDrag() {
    dragState.value = null
    dropTarget.value = null
  }

  function setDropTarget(initiativeId: string, week: number | null) {
    dropTarget.value = week === null ? null : { initiativeId, week }
  }

  function isDropTarget(initiativeId: string, week: number): boolean {
    return (
      dropTarget.value?.initiativeId === initiativeId &&
      dropTarget.value?.week === week
    )
  }

  function handleMemberDrop(
    initiative: Initiative,
    member: TeamMember,
    startWeek: number,
    role?: RoleType
  ): boolean {
    let assignedRole = role
    if (!assignedRole) {
      const match = initiative.roleRequirements.find((req) =>
        member.roles.includes(req.role)
      )
      assignedRole = match?.role || initiative.roleRequirements[0]?.role
    }
    if (!assignedRole) return false

    const newAssignment: Assignment = {
      memberId: member.id,
      role: assignedRole,
      weeksAllocated: 1,
      startWeek,
      isParallel: false,
    }
    initiativesStore.addAssignment(initiative.id, newAssignment)
    return true
  }

  function handleAssignmentMove(
    sourceInitiative: Initiative,
    sourceAssignment: Assignment,
    targetInitiative: Initiative,
    targetWeek: number
  ): boolean {
    // Use value comparison (not identity) because reactive proxies
    // may not be the same object reference after drag serialization
    const idx = sourceInitiative.assignments.findIndex(
      (a) =>
        a.memberId === sourceAssignment.memberId &&
        a.role === sourceAssignment.role &&
        a.startWeek === sourceAssignment.startWeek &&
        a.weeksAllocated === sourceAssignment.weeksAllocated
    )
    if (idx === -1) return false

    const updated = { ...sourceAssignment, startWeek: targetWeek }
    if (sourceInitiative.id === targetInitiative.id) {
      initiativesStore.updateAssignment(sourceInitiative.id, idx, updated)
    } else {
      initiativesStore.removeAssignment(sourceInitiative.id, idx)
      initiativesStore.addAssignment(targetInitiative.id, updated)
    }
    return true
  }

  function handleDropOnWeek(
    targetInitiative: Initiative,
    targetWeek: number
  ): boolean {
    if (!dragState.value) return false

    if (dragState.value.type === 'member') {
      const member = dragState.value.data as TeamMember
      return handleMemberDrop(targetInitiative, member, targetWeek)
    }

    const assignment = dragState.value.data as Assignment
    const src = initiativesStore.initiatives.find(
      (i) => i.id === dragState.value!.sourceInitiativeId
    )
    if (!src) return false
    return handleAssignmentMove(src, assignment, targetInitiative, targetWeek)
  }

  function getDropRole(
    member: TeamMember,
    initiative: Initiative
  ): RoleType | undefined {
    const match = initiative.roleRequirements.find((req) =>
      member.roles.includes(req.role)
    )
    return match?.role || initiative.roleRequirements[0]?.role
  }

  return {
    dragState,
    dropTarget,
    isDragging,
    startMemberDrag,
    startAssignmentDrag,
    endDrag,
    setDropTarget,
    isDropTarget,
    handleDropOnWeek,
    handleMemberDrop,
    handleAssignmentMove,
    getDropRole,
  }
}
