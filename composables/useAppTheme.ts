import { ref, computed, watch } from 'vue'
import { useTheme as useVuetifyTheme } from 'vuetify'

// Note: We import as useVuetifyTheme to avoid conflict with our export

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'capest-theme'

// Global state shared across all instances
const mode = ref<ThemeMode>('system')
const isInitialized = ref(false)

function getSystemTheme(): 'light' | 'dark' {
  if (import.meta.client && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

function loadStoredMode(): ThemeMode {
  if (import.meta.client) {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  }
  return 'system'
}

export function useAppTheme() {
  const vuetifyTheme = useVuetifyTheme()

  // Initialize only once
  if (!isInitialized.value) {
    mode.value = loadStoredMode()
    isInitialized.value = true
  }

  // Computed actual theme based on mode
  const currentTheme = computed(() => {
    if (mode.value === 'system') {
      return getSystemTheme()
    }
    return mode.value
  })

  const isDark = computed(() => currentTheme.value === 'dark')

  // Apply theme to Vuetify
  function applyTheme() {
    vuetifyTheme.global.name.value = currentTheme.value
  }

  // Watch for mode changes and apply
  watch(mode, () => {
    applyTheme()
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, mode.value)
    }
  })

  // Watch for system theme changes when in system mode
  if (import.meta.client && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (mode.value === 'system') {
        applyTheme()
      }
    })
  }

  function setTheme(newMode: ThemeMode) {
    mode.value = newMode
  }

  function toggleTheme() {
    // Simple toggle: light -> dark -> light
    if (mode.value === 'light') {
      mode.value = 'dark'
    } else if (mode.value === 'dark') {
      mode.value = 'light'
    } else {
      // In system mode, switch to opposite of current
      mode.value = isDark.value ? 'light' : 'dark'
    }
  }

  function cycleTheme() {
    // Cycle through: light -> dark -> system -> light
    const cycle: ThemeMode[] = ['light', 'dark', 'system']
    const currentIndex = cycle.indexOf(mode.value)
    mode.value = cycle[(currentIndex + 1) % cycle.length]
  }

  function getModeIcon(): string {
    switch (mode.value) {
      case 'light':
        return 'mdi-white-balance-sunny'
      case 'dark':
        return 'mdi-moon-waning-crescent'
      case 'system':
        return 'mdi-theme-light-dark'
    }
  }

  function getModeLabel(): string {
    switch (mode.value) {
      case 'light':
        return 'Light Mode'
      case 'dark':
        return 'Dark Mode'
      case 'system':
        return 'System'
    }
  }

  return {
    mode,
    currentTheme,
    isDark,
    setTheme,
    toggleTheme,
    cycleTheme,
    applyTheme,
    getModeIcon,
    getModeLabel,
  }
}
