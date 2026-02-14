import { describe, it, expect, beforeEach } from 'vitest'
import type { TeamMember, Initiative, QuarterConfig } from '~/types'
import {
  calculateMemberQuarterCapacity,
  getAssignmentsForWeek,
  detectOverAllocation,
  calculateQuarterCapacitySummary,
  checkCarryOver,
  getAvailableMembersForRole,
} from '~/utils/capacityCalculator'

describe('capacityCalculator', () => {
  const mockQuarter: QuarterConfig = {
    id: 'Q1-2025',
    label: '2025 Q1',
    totalWeeks: 13,
    startDate: new Date(2025, 0, 1),
    endDate: new Date(2025, 2, 31),
  }

  const mockMembers: TeamMember[] = [
    {
      id: 'member-1',
      name: 'John Doe',
      roles: ['BE', 'FE'],
      availability: 13,
      assignedInitiatives: ['initiative-1'],
    },
    {
      id: 'member-2',
      name: 'Jane Smith',
      roles: ['QA'],
      availability: 10,
      assignedInitiatives: [],
    },
  ]

  const mockInitiatives: Initiative[] = [
    {
      id: 'initiative-1',
      name: 'Project Alpha',
      description: 'Test project',
      quarter: 'Q1-2025',
      roleRequirements: [
        { role: 'BE', effort: 8 },
        { role: 'QA', effort: 4 },
      ],
      assignments: [
        {
          memberId: 'member-1',
          role: 'BE',
          weeksAllocated: 8,
          startWeek: 1,
          isParallel: false,
        },
      ],
    },
  ]

  describe('calculateMemberQuarterCapacity', () => {
    it('should calculate correct capacity for assigned member', () => {
      const capacity = calculateMemberQuarterCapacity(
        mockMembers[0],
        mockInitiatives,
        'Q1-2025'
      )

      expect(capacity.memberId).toBe('member-1')
      expect(capacity.available).toBe(13)
      expect(capacity.allocated).toBe(8)
      expect(capacity.remaining).toBe(5)
      expect(capacity.isOverAllocated).toBe(false)
    })

    it('should show zero allocation for unassigned member', () => {
      const capacity = calculateMemberQuarterCapacity(
        mockMembers[1],
        mockInitiatives,
        'Q1-2025'
      )

      expect(capacity.allocated).toBe(0)
      expect(capacity.remaining).toBe(10)
    })

    it('should detect over-allocation', () => {
      const overInitiatives: Initiative[] = [
        {
          id: 'initiative-2',
          name: 'Big Project',
          description: 'Test',
          quarter: 'Q1-2025',
          roleRequirements: [],
          assignments: [
            {
              memberId: 'member-2',
              role: 'QA',
              weeksAllocated: 15, // More than availability (10)
              startWeek: 1,
              isParallel: false,
            },
          ],
        },
      ]

      const capacity = calculateMemberQuarterCapacity(
        mockMembers[1],
        overInitiatives,
        'Q1-2025'
      )

      expect(capacity.isOverAllocated).toBe(true)
      expect(capacity.remaining).toBe(-5)
    })
  })

  describe('getAssignmentsForWeek', () => {
    it('should return assignments for specific week', () => {
      const assignments = getAssignmentsForWeek(mockInitiatives, 'Q1-2025', 1)

      expect(assignments).toHaveLength(1)
      expect(assignments[0].assignment.memberId).toBe('member-1')
    })

    it('should return empty array for week outside assignment range', () => {
      const assignments = getAssignmentsForWeek(mockInitiatives, 'Q1-2025', 10)

      expect(assignments).toHaveLength(0)
    })

    it('should return empty array for wrong quarter', () => {
      const assignments = getAssignmentsForWeek(mockInitiatives, 'Q2-2025', 1)

      expect(assignments).toHaveLength(0)
    })
  })

  describe('detectOverAllocation', () => {
    it('should detect over-allocated members', () => {
      const overInitiatives: Initiative[] = [
        {
          id: 'initiative-2',
          name: 'Big Project',
          description: 'Test',
          quarter: 'Q1-2025',
          roleRequirements: [],
          assignments: [
            {
              memberId: 'member-2',
              role: 'QA',
              weeksAllocated: 15,
              startWeek: 1,
              isParallel: false,
            },
          ],
        },
      ]

      const result = detectOverAllocation(mockMembers, overInitiatives, 'Q1-2025')

      expect(result).toHaveLength(1)
      expect(result[0].memberId).toBe('member-2')
      expect(result[0].excessWeeks).toBe(5)
    })

    it('should return empty array when no over-allocation', () => {
      const result = detectOverAllocation(mockMembers, mockInitiatives, 'Q1-2025')

      expect(result).toHaveLength(0)
    })
  })

  describe('calculateQuarterCapacitySummary', () => {
    it('should calculate complete quarter summary', () => {
      const summary = calculateQuarterCapacitySummary(
        mockMembers,
        mockInitiatives,
        mockQuarter
      )

      expect(summary.quarterId).toBe('Q1-2025')
      expect(summary.totalAvailable).toBe(23) // 13 + 10
      expect(summary.totalAllocated).toBe(8)
      expect(summary.memberCapacities).toHaveLength(2)
    })

    it('should identify unassigned requirements', () => {
      const summary = calculateQuarterCapacitySummary(
        mockMembers,
        mockInitiatives,
        mockQuarter
      )

      const qaUnassigned = summary.unassignedRequirements.find(
        (r) => r.role === 'QA'
      )

      // QA requires 4 weeks but no one is assigned
      expect(qaUnassigned).toBeDefined()
      expect(qaUnassigned?.effort).toBe(4)
    })
  })

  describe('checkCarryOver', () => {
    it('should detect no carry over when assignment fits in quarter', () => {
      const result = checkCarryOver(
        { startWeek: 1, weeksAllocated: 8 },
        mockQuarter
      )

      expect(result.carriesOver).toBe(false)
      expect(result.inQuarterWeeks).toBe(8)
    })

    it('should detect carry over when assignment exceeds quarter', () => {
      const result = checkCarryOver(
        { startWeek: 10, weeksAllocated: 8 },
        mockQuarter
      )

      expect(result.carriesOver).toBe(true)
      expect(result.inQuarterWeeks).toBe(4) // weeks 10-13
      expect(result.carriedWeeks).toBe(4) // weeks 14-17
    })
  })

  describe('getAvailableMembersForRole', () => {
    it('should return members with matching role sorted by remaining capacity', () => {
      const available = getAvailableMembersForRole(
        mockMembers,
        'BE',
        mockInitiatives,
        'Q1-2025'
      )

      expect(available).toHaveLength(1)
      expect(available[0].member.id).toBe('member-1')
      expect(available[0].remainingCapacity).toBe(5)
    })

    it('should return empty array for role with no matching members', () => {
      const available = getAvailableMembersForRole(
        mockMembers,
        'MOBILE',
        mockInitiatives,
        'Q1-2025'
      )

      expect(available).toHaveLength(0)
    })
  })
})
