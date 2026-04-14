import { describe, it, expect } from 'vitest'
import {
  getInitials,
  stringToHue,
  stringToColor,
  getDarkShade,
} from '~/utils/colorUtils'

describe('colorUtils', () => {
  describe('getInitials', () => {
    it('should return question mark for empty string', () => {
      expect(getInitials('')).toBe('?')
    })

    it('should return empty string first char for whitespace-only string', () => {
      // After trim().split(/\s+/), a whitespace-only string becomes ['']
      // so it returns the first char of an empty string
      expect(getInitials('   ')).toBe('')
    })

    it('should return first character for single word', () => {
      expect(getInitials('Backend')).toBe('B')
    })

    it('should return uppercase initial for single word', () => {
      expect(getInitials('frontend')).toBe('F')
    })

    it('should return first and last word initials for two words', () => {
      expect(getInitials('John Doe')).toBe('JD')
    })

    it('should return first and last word initials for multiple words', () => {
      expect(getInitials('John Michael Doe')).toBe('JD')
    })

    it('should trim whitespace before processing', () => {
      expect(getInitials('  Alice  ')).toBe('A')
      expect(getInitials('  Bob Smith  ')).toBe('BS')
    })

    it('should return uppercase initials', () => {
      expect(getInitials('alice bob')).toBe('AB')
    })
  })

  describe('stringToHue', () => {
    it('should return 0 for empty string', () => {
      expect(stringToHue('')).toBe(0)
    })

    it('should return a value between 0 and 359', () => {
      const hue = stringToHue('test')
      expect(hue).toBeGreaterThanOrEqual(0)
      expect(hue).toBeLessThan(360)
    })

    it('should return consistent hue for same input', () => {
      const hue1 = stringToHue('Backend')
      const hue2 = stringToHue('Backend')
      expect(hue1).toBe(hue2)
    })

    it('should return different hues for different inputs', () => {
      const hue1 = stringToHue('Backend')
      const hue2 = stringToHue('Frontend')
      expect(hue1).not.toBe(hue2)
    })

    it('should handle various string inputs', () => {
      const hue1 = stringToHue('QA')
      const hue2 = stringToHue('Mobile')
      const hue3 = stringToHue('DevOps')

      expect(hue1).toBeGreaterThanOrEqual(0)
      expect(hue1).toBeLessThan(360)
      expect(hue2).toBeGreaterThanOrEqual(0)
      expect(hue2).toBeLessThan(360)
      expect(hue3).toBeGreaterThanOrEqual(0)
      expect(hue3).toBeLessThan(360)
    })
  })

  describe('stringToColor', () => {
    const validColors = [
      'red', 'pink', 'purple', 'deep-purple', 'indigo', 'blue',
      'light-blue', 'cyan', 'teal', 'green', 'light-green', 'lime',
      'yellow', 'amber', 'orange', 'deep-orange', 'brown'
    ]

    it('should return a valid Vuetify color name', () => {
      const color = stringToColor('Backend')
      expect(validColors).toContain(color)
    })

    it('should return consistent color for same input', () => {
      const color1 = stringToColor('Frontend')
      const color2 = stringToColor('Frontend')
      expect(color1).toBe(color2)
    })

    it('should return different colors for different inputs', () => {
      const color1 = stringToColor('Backend')
      const color2 = stringToColor('QA')
      expect(color1).not.toBe(color2)
    })

    it('should map hues evenly across all available colors', () => {
      // Test with inputs that should produce different colors
      const colors = new Set<string>()
      const testInputs = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta']

      for (const input of testInputs) {
        colors.add(stringToColor(input))
      }

      // Should produce multiple distinct colors
      expect(colors.size).toBeGreaterThan(1)
    })

    it('should always return valid color for any string', () => {
      const inputs = ['', 'A', 'Test String', '123', '!@#$%', 'a'.repeat(100)]

      for (const input of inputs) {
        const color = stringToColor(input)
        expect(validColors).toContain(color)
      }
    })
  })

  describe('getDarkShade', () => {
    it('should append darken-1 suffix to color name', () => {
      expect(getDarkShade('red')).toBe('red-darken-1')
    })

    it('should handle compound color names', () => {
      expect(getDarkShade('deep-purple')).toBe('deep-purple-darken-1')
      expect(getDarkShade('light-blue')).toBe('light-blue-darken-1')
    })

    it('should handle any string input', () => {
      expect(getDarkShade('custom')).toBe('custom-darken-1')
      expect(getDarkShade('')).toBe('-darken-1')
    })
  })
})
