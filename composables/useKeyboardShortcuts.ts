import { onMounted, onUnmounted } from 'vue'

export interface ShortcutDef {
  key: string
  description: string
  handler: () => void
  /** Only trigger when no input/textarea/select is focused */
  requireNoInput?: boolean
}

/**
 * Composable for registering page-level keyboard shortcuts.
 * Automatically cleans up on component unmount.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutDef[]) {
  function onKeyDown(e: KeyboardEvent) {
    // Don't trigger shortcuts when typing in inputs
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
    const isInput = tag === 'input' || tag === 'textarea' || tag === 'select'

    for (const shortcut of shortcuts) {
      if (shortcut.requireNoInput !== false && isInput) continue

      if (e.key === shortcut.key) {
        e.preventDefault()
        shortcut.handler()
        return
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
  })

  return { shortcuts }
}

/**
 * Global registry of shortcut descriptions for the help dialog.
 * Pages register their shortcuts here so the help dialog can display them all.
 */
import { ref } from 'vue'

const globalShortcuts = ref<Array<{ key: string; description: string; page: string }>>([])

export function useGlobalShortcuts() {
  function registerShortcuts(page: string, shortcuts: Array<{ key: string; description: string }>) {
    // Remove existing shortcuts for this page
    const filtered = globalShortcuts.value.filter(s => s.page !== page)
    globalShortcuts.value = [
      ...filtered,
      ...shortcuts.map(s => ({ ...s, page })),
    ]
  }

  function unregisterShortcuts(page: string) {
    globalShortcuts.value = globalShortcuts.value.filter(s => s.page !== page)
  }

  function getAllShortcuts() {
    return globalShortcuts.value
  }

  return {
    globalShortcuts,
    registerShortcuts,
    unregisterShortcuts,
    getAllShortcuts,
  }
}
