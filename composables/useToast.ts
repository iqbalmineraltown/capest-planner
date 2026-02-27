import { ref, readonly } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  message: string
  type: ToastType
  timeout: number
}

// ─── Shared singleton state ─────────────────────────────────
const visible = ref(false)
const message = ref('')
const type = ref<ToastType>('info')
const timeout = ref(3000)
const queue = ref<ToastMessage[]>([])

let timer: ReturnType<typeof setTimeout> | null = null

function processQueue() {
  if (queue.value.length === 0) {
    visible.value = false
    return
  }

  const next = queue.value.shift()!
  message.value = next.message
  type.value = next.type
  timeout.value = next.timeout
  visible.value = true

  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    visible.value = false
    // Small delay before processing next toast so the snackbar can close
    setTimeout(() => processQueue(), 300)
  }, next.timeout)
}

/**
 * Composable for global toast/snackbar notifications.
 * Uses singleton state shared across all components.
 */
export function useToast() {
  function show(msg: string, toastType: ToastType = 'info', ms = 3000) {
    const toast: ToastMessage = { message: msg, type: toastType, timeout: ms }

    if (visible.value) {
      queue.value.push(toast)
    } else {
      message.value = toast.message
      type.value = toast.type
      timeout.value = toast.timeout
      visible.value = true

      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        visible.value = false
        setTimeout(() => processQueue(), 300)
      }, toast.timeout)
    }
  }

  function dismiss() {
    if (timer) clearTimeout(timer)
    visible.value = false
    setTimeout(() => processQueue(), 300)
  }

  function success(msg: string, ms?: number) {
    show(msg, 'success', ms)
  }

  function error(msg: string, ms?: number) {
    show(msg, 'error', ms)
  }

  function info(msg: string, ms?: number) {
    show(msg, 'info', ms)
  }

  function warning(msg: string, ms?: number) {
    show(msg, 'warning', ms)
  }

  return {
    // State (readonly for external consumers)
    visible: readonly(visible),
    message: readonly(message),
    type: readonly(type),
    timeout: readonly(timeout),
    // Internal writable ref for v-model binding in AppSnackbar
    _visible: visible,
    // Methods
    show,
    dismiss,
    success,
    error,
    info,
    warning,
  }
}
