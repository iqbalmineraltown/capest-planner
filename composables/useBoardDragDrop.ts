import { ref, computed, type Ref } from 'vue'
import { dragAndDrop } from '@formkit/drag-and-drop/vue'
import type { Initiative, Assignment, TeamMember, RoleType } from '~/types'
import { useInitiativesStore } from '~/stores/initiatives'
import { useMembersStore } from '~/stores/members'

/**
 * Drag state for tracking what's being dragged
 */
export interface DragState {
  /** Type of item being dragged */
  type: 'member' | 'assignment'
  /** The data being dragged (member or assignment) */
  data: TeamMember | Assignment
  /** Source initiative ID if dragging an assignment */
  sourceInitiativeId?: string
  /** Source week if dragging an assignment */
  sourceWeek?: number
}

/**
 * Drop payload when dropping on a week cell
 */
export interface DropPayload {
  /** Target initiative */
  initiative: Initiative
  /** Target week number */
  week: number
  /** Member ID if dropping a member */
  memberId?: string
  /** Role for the assignment */
  role?: RoleType
  /** Source initiative ID if moving an assignment */
  sourceInitiativeId?: string
  /** Source assignment index if moving */
  sourceAssignmentIndex?: number
  /** Source assignment if moving */
  sourceAssignment?: Assignment
}

// Shared state - defined outside the composable to ensure singleton behavior
const dragState = ref<DragState | null>(null)
const dropTarget = ref<{ initiativeId: string; week: number } | null>(null)
const isDragging = computed(() => dragState.value !== null)

/**
 * Composable for managing smooth drag-and-drop operations on the capacity board
 * Uses shared state to coordinate drag operations across all components
 */
export function useBoardDragDrop() {
  const initiativesStore = useInitiativesStore()
  const membersStore = useMembersStore()

  /**
   * Start dragging a member from the pool
   */
  function startMemberDrag(member: TeamMember) {
    dragState.value = {
      type: 'member',
      data: member,
    }
  }

  /**
   * Start dragging an assignment from a cell
   */
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

  /**
   * End the current drag operation
   */
  function endDrag() {
    dragState.value = null
    dropTarget.value = null
  }

  /**
   * Set the current drop target
   */
  function setDropTarget(initiativeId: string, week: number | null) {
    if (week === null) {
      dropTarget.value = null
    } else {
      dropTarget.value = { initiativeId, week }
    }
  }

  /**
   * Check if a cell is the current drop target
   */
  function isDropTarget(initiativeId: string, week: number): boolean {
    return (
      dropTarget.value?.initiativeId === initiativeId &&
      dropTarget.value?.week === week
    )
  }

  /**
   * Handle dropping a member on a week cell
   */
  function handleMemberDrop(
    initiative: Initiative,
    member: TeamMember,
    startWeek: number,
    role?: RoleType
  ): boolean {
    // Find matching role requirement
    let assignedRole = role
    if (!assignedRole) {
      const matchingRequirement = initiative.roleRequirements.find((req) =>
        member.roles.includes(req.role)
      )
      assignedRole = matchingRequirement?.role || initiative.roleRequirements[0]?.role
    }

    if (!assignedRole) {
      return false
    }

    // Create new assignment
    const newAssignment: Assignment = {
      memberId: member.id,
      role: assignedRole,
      weeksAllocated: 1,
      startWeek,
      isParallel: false,
    }

    // Add to initiative
    initiativesStore.addAssignment(initiative.id, newAssignment)
    return true
  }

  /**
   * Handle moving an assignment to a different week/initiative
   */
  function handleAssignmentMove(
    sourceInitiative: Initiative,
    sourceAssignment: Assignment,
    targetInitiative: Initiative,
    targetWeek: number
  ): boolean {
    // Find the assignment index
    const assignmentIndex = sourceInitiative.assignments.findIndex(
      (a) =>
        a.memberId === sourceAssignment.memberId &&
        a.startWeek === sourceAssignment.startWeek
    )

    if (assignmentIndex === -1) {
      return false
    }

    // Update the assignment's start week
    const updatedAssignment = {
      ...sourceAssignment,
      startWeek: targetWeek,
    }

    // If moving within same initiative, just update
    if (sourceInitiative.id === targetInitiative.id) {
      initiativesStore.updateAssignment(sourceInitiative.id, assignmentIndex, updatedAssignment)
    } else {
      // Remove from source, add to target
      initiativesStore.removeAssignment(sourceInitiative.id, assignmentIndex)
      initiativesStore.addAssignment(targetInitiative.id, updatedAssignment)
    }

    return true
  }

  /**
   * Handle a drop on a week cell
   */
  function handleDropOnWeek(
    targetInitiative: Initiative,
    targetWeek: number
  ): boolean {
    if (!dragState.value) return false

    if (dragState.value.type === 'member') {
      const member = dragState.value.data as TeamMember
      return handleMemberDrop(targetInitiative, member, targetWeek)
    } else {
      const assignment = dragState.value.data as Assignment
      const sourceInitiative = initiativesStore.initiatives.find(
        (i) => i.id === dragState.value!.sourceInitiativeId
      )
      if (!sourceInitiative) return false
      return handleAssignmentMove(sourceInitiative, assignment, targetInitiative, targetWeek)
    }
  }

  /**
   * Initialize drag and drop on a container element
   * Note: Currently not used but kept for future enhancement
   */
  function initDraggable(
    containerRef: Ref<HTMLElement | null>,
    values: Ref<unknown[]>,
    _options?: {
      draggable?: (el: Element) => boolean
      onDragStart?: (data: unknown) => void
      onDragEnd?: () => void
      onDrop?: (newValues: unknown[]) => void
    }
  ) {
    if (!containerRef.value) return

    dragAndDrop({
      parent: containerRef.value,
      values: values.value,
      draggable: (el: Element) => {
        const isDraggable = el.classList.contains('draggable-item')
        return _options?.draggable ? _options.draggable(el) : isDraggable
      },
    })
  }

  /**
   * Get the role to use when dropping a member
   */
  function getDropRole(member: TeamMember, initiative: Initiative): RoleType | undefined {
    const matchingRequirement = initiative.roleRequirements.find((req) =>
      member.roles.includes(req.role)
    )
    return matchingRequirement?.role || initiative.roleRequirements[0]?.role
  }

  return {
    // State
    dragState,
    dropTarget,
    isDragging,

    // Actions
    startMemberDrag,
    startAssignmentDrag,
    endDrag,
    setDropTarget,
    isDropTarget,

    // Handlers
    handleDropOnWeek,
    handleMemberDrop,
    handleAssignmentMove,
    getDropRole,

    // Utilities
    initDraggable,
  }
}
