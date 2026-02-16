import { useAppTheme } from '~/composables/useAppTheme'

export default defineNuxtPlugin(() => {
  // Only run on client side and when Vue instance is available
  if (!import.meta.client) return

  try {
    const { applyTheme } = useAppTheme()

    // Apply stored theme on app mount
    applyTheme()

    // Listen for system preference changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', () => {
        // The composable handles this internally, but we reapply to be safe
        applyTheme()
      })
    }
  } catch {
    // Silently fail during SSR or test environment
  }
})
