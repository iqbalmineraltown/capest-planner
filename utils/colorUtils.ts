/**
 * Color utility functions for generating consistent colors from strings
 */

/**
 * Generate initials from a name
 * Takes the first character of each word, up to 2 characters
 */
export function getInitials(name: string): string {
  if (!name) return '?'

  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }

  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}

/**
 * Convert a string to a consistent color hue
 * Uses a simple hash function to generate a hue value (0-360)
 */
export function stringToHue(str: string): number {
  if (!str) return 0

  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  return Math.abs(hash % 360)
}

/**
 * Convert a string to a consistent color name
 * Returns one of the Vuetify color names
 */
export function stringToColor(str: string): string {
  const hue = stringToHue(str)

  // Map hue to Vuetify color names
  const colors = [
    'red', 'pink', 'purple', 'deep-purple', 'indigo', 'blue',
    'light-blue', 'cyan', 'teal', 'green', 'light-green', 'lime',
    'yellow', 'amber', 'orange', 'deep-orange', 'brown'
  ]

  const index = Math.floor((hue / 360) * colors.length)
  return colors[index % colors.length]
}

/**
 * Get a darker shade of a color for backgrounds
 */
export function getDarkShade(colorName: string): string {
  return `${colorName}-darken-1`
}
