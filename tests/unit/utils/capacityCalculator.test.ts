import { describe, it, expect, beforeEach } from 'vitest'
import type { TeamMember, Initiative, QuarterConfig } from '~/types'
import {
  calculateMemberQuarterCapacity,
  getAssignmentsForWeek,
  detectOverAllocation,
  calculateQuarterCapacitySummary,
  checkCarryOver,
  getAvailableMembersForRole,
  checkWeekConflicts,
  getInitiativeWarnings,
  getRoleFulfillment,
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
        { memberId: 'member-1', role: 'BE', startWeek: 1, weeksAllocated: 8, isParallel: false },
        mockQuarter
      )

      expect(result.carriesOver).toBe(false)
      expect(result.inQuarterWeeks).toBe(8)
    })

    it('should detect carry over when assignment exceeds quarter', () => {
      const result = checkCarryOver(
        { memberId: 'member-1', role: 'BE', startWeek: 10, weeksAllocated: 8, isParallel: false },
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

  describe('checkWeekConflicts', () => {
    it('should detect no conflict when weeks do not overlap', () => {
      const result = checkWeekConflicts(
        'member-1',
        1,
        4,
        mockInitiatives,
        'Q1-2025',
        'initiative-1'
      )

      expect(result.hasConflict).toBe(false)
      expect(result.conflictingWeeks).toHaveLength(0)
    })

    it('should detect conflict when weeks overlap with another initiative', () => {
      // Member 1 is assigned to initiative-1 on weeks 1-4
      // Now trying to assign to initiative-2 on weeks 3-6
      const result = checkWeekConflicts(
        'member-1',
        3,
        4,
        mockInitiatives,
        'Q1-2025',
        'initiative-2'
      )

      expect(result.hasConflict).toBe(true)
      expect(result.conflictingWeeks).toContain(3)
      expect(result.conflictingWeeks).toContain(4)
    })

    it('should not detect conflict when excluding same initiative and assignment', () => {
      const result = checkWeekConflicts(
        'member-1',
        1,
        4,
        mockInitiatives,
        'Q1-2025',
        'initiative-1',
        0
      )

      expect(result.hasConflict).toBe(false)
    })
  })

  describe('getInitiativeWarnings', () => {
    it('should detect unfilled roles', () => {
      // mockInitiatives[0] has QA requirement (4 weeks) but no QA assignment
      const result = getInitiativeWarnings(
        mockInitiatives[0],
        mockMembers,
        mockInitiatives,
        'Q1-2025'
      )

      expect(result.hasWarnings).toBe(true)
      expect(result.unfilledRoles).toHaveLength(1)
      expect(result.unfilledRoles[0].role).toBe('QA')
      expect(result.unfilledRoles[0].required).toBe(4)
      expect(result.unfilledRoles[0].assigned).toBe(0)
    })

    it('should detect over-capacity members', () => {
      // Create an initiative with member-2 assigned beyond their capacity (10 weeks)
      const overCapacityInitiative: Initiative = {
        id: 'test-initiative',
        name: 'Test Initiative',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [{ role: 'QA', effort: 20 }],
        assignments: [
          { memberId: 'member-2', role: 'QA', weeksAllocated: 15, startWeek: 1, isParallel: false }
        ]
      }

      const result = getInitiativeWarnings(
        overCapacityInitiative,
        mockMembers,
        [overCapacityInitiative],
        'Q1-2025'
      )

      expect(result.hasWarnings).toBe(true)
      expect(result.overCapacityMembers).toContain('Jane Smith')
    })

    it('should return no warnings when all roles are fulfilled and capacity is fine', () => {
      const fulfilledInitiative: Initiative = {
        id: 'fulfilled-initiative',
        name: 'Fulfilled Initiative',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [{ role: 'QA', effort: 4 }],
        assignments: [
          { memberId: 'member-2', role: 'QA', weeksAllocated: 4, startWeek: 1, isParallel: false }
        ]
      }

      const result = getInitiativeWarnings(
        fulfilledInitiative,
        mockMembers,
        [fulfilledInitiative],
        'Q1-2025'
      )

      expect(result.hasWarnings).toBe(false)
      expect(result.overCapacityMembers).toHaveLength(0)
      expect(result.unfilledRoles).toHaveLength(0)
    })
  })

  describe('getRoleFulfillment', () => {
    it('should calculate fulfillment for each role requirement', () => {
      const result = getRoleFulfillment(mockInitiatives[0])

      expect(result).toHaveLength(2)

      // BE role: required 8, assigned 8 (100%)
      const beFulfillment = result.find(r => r.role === 'BE')
      expect(beFulfillment).toBeDefined()
      expect(beFulfillment?.required).toBe(8)
      expect(beFulfillment?.assigned).toBe(8)
      expect(beFulfillment?.percentage).toBe(100)

      // QA role: required 4, assigned 0 (0%)
      const qaFulfillment = result.find(r => r.role === 'QA')
      expect(qaFulfillment).toBeDefined()
      expect(qaFulfillment?.required).toBe(4)
      expect(qaFulfillment?.assigned).toBe(0)
      expect(qaFulfillment?.percentage).toBe(0)
    })

    it('should show partial fulfillment correctly', () => {
      const partialInitiative: Initiative = {
        id: 'partial-initiative',
        name: 'Partial Initiative',
        description: 'Test',
        quarter: 'Q1-2025',
        roleRequirements: [{ role: 'BE', effort: 10 }],
        assignments: [
          { memberId: 'member-1', role: 'BE', weeksAllocated: 6, startWeek: 1, isParallel: false }
        ]
      }

      const result = getRoleFulfillment(partialInitiative)

      expect(result).toHaveLength(1)
      expect(result[0].required).toBe(10)
      expect(result[0].assigned).toBe(6)
      expect(result[0].percentage).toBe(60)
    })
  })
})
