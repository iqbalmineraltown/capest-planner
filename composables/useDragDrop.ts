import { ref, type Ref } from 'vue'

export interface DragData {
  type: 'assignment' | 'initiative'
  id: string
  initiativeId?: string
  memberId?: string
  role?: string
  sourceQuarterId?: string
}

export interface DropZone {
  acceptsType: DragData['type'][] | '*'
  quarterId?: string
  weekNumber?: number
  initiativeId?: string
}

/**
 * Composable for managing drag and drop state
 */
export function useDragDrop() {
  const isDragging = ref(false)
  const dragData: Ref<DragData | null> = ref(null)
  const dropTarget: Ref<string | null> = ref(null)

  /**
   * Start dragging an item
   */
  function startDrag(data: DragData): void {
    isDragging.value = true
    dragData.value = data
  }

  /**
   * End dragging
   */
  function endDrag(): void {
    isDragging.value = false
    dragData.value = null
    dropTarget.value = null
  }

  /**
   * Set the current drop target
   */
  function setDropTarget(targetId: string | null): void {
    dropTarget.value = targetId
  }

  /**
   * Check if a zone can accept the current drag item
   */
  function canDrop(zone: DropZone): boolean {
    if (!isDragging.value || !dragData.value) return false

    if (zone.acceptsType === '*') return true
    return zone.acceptsType.includes(dragData.value.type)
  }

  /**
   * Get drag data for HTML5 drag events
   */
  function getDragEventData(): string {
    return JSON.stringify(dragData.value)
  }

  /**
   * Parse drag data from HTML5 drag events
   */
  function parseDragEventData(data: string): DragData | null {
    try {
      return JSON.parse(data) as DragData
    } catch {
      return null
    }
  }

  return {
    isDragging,
    dragData,
    dropTarget,
    startDrag,
    endDrag,
    setDropTarget,
    canDrop,
    getDragEventData,
    parseDragEventData,
  }
}

/**
 * Generate CSS classes for draggable elements
 */
export function getDragClasses(isDragging: boolean, isDropTarget: boolean): string {
  const classes: string[] = []

  if (isDragging) {
    classes.push('opacity-50', 'cursor-grabbing')
  } else {
    classes.push('cursor-grab')
  }

  if (isDropTarget) {
    classes.push('ring-2', 'ring-primary')
  }

  return classes.join(' ')
}
