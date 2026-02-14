import { ref, watch, type Ref } from 'vue'

/**
 * Composable for persistent storage using localStorage
 * Automatically syncs reactive state with localStorage
 */
export function useLocalStorage<T>(key: string, defaultValue: T): Ref<T> {
  // Load initial value
  const loadValue = (): T => {
    if (typeof window === 'undefined') return defaultValue

    try {
      const stored = localStorage.getItem(key)
      if (stored === null) return defaultValue
      return JSON.parse(stored) as T
    } catch {
      console.warn(`Failed to load ${key} from localStorage`)
      return defaultValue
    }
  }

  const data = ref<T>(loadValue()) as Ref<T>

  // Watch for changes and persist
  watch(
    data,
    (newValue) => {
      if (typeof window === 'undefined') return

      try {
        localStorage.setItem(key, JSON.stringify(newValue))
      } catch (error) {
        console.error(`Failed to save ${key} to localStorage:`, error)
      }
    },
    { deep: true }
  )

  return data
}

/**
 * Clear a specific key from localStorage
 */
export function clearLocalStorage(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}

/**
 * Clear all app-related localStorage keys
 */
export function clearAllAppStorage(): void {
  if (typeof window === 'undefined') return

  const keysToRemove = Object.keys(localStorage).filter((key) =>
    key.startsWith('capest-')
  )

  keysToRemove.forEach((key) => localStorage.removeItem(key))
}
