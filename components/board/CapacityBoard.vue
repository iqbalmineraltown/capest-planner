<template>
  <div class="capacity-board-container">
    <!-- Member Pool Sidebar -->
    <v-card class="member-pool mb-4">
      <v-card-title class="py-2 px-4 d-flex align-center">
        <v-icon start size="small">mdi-account-group</v-icon>
        <span class="text-subtitle-1">Available Crew</span>
        <v-spacer />
        <v-chip size="x-small" color="primary" variant="tonal">
          {{ availableMembers.length }} available
        </v-chip>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-2">
        <v-row dense>
          <v-col
            v-for="member in availableMembers"
            :key="member.id"
            cols="6" sm="4" md="3" lg="2"
          >
            <v-card
              class="member-pool-card pa-2"
              variant="outlined"
              :draggable="true"
              @dragstart="handleDragStart($event, member)"
              @dragend="handleDragEnd"
            >
              <div class="d-flex align-center">
                <v-avatar
                  :color="getMemberColor(member.name)"
                  size="32"
                  class="mr-2"
                >
                  <span class="text-caption font-weight-bold">{{ getInitials(member.name) }}</span>
                </v-avatar>
                <div class="flex-grow-1 overflow-hidden">
                  <div class="text-caption font-weight-medium text-truncate">{{ member.name }}</div>
                  <div class="d-flex flex-wrap ga-1">
                    <v-chip
                      v-for="role in member.roles.slice(0, 2)"
                      :key="role"
                      :color="getRoleColor(role)"
                      size="x-small"
                      variant="tonal"
                    >
                      {{ role }}
                    </v-chip>
                  </div>
                </div>
              </div>
              <div class="text-caption text-grey mt-1">
                {{ member.availability - getAllocatedWeeks(member.id) }}w available
              </div>
            </v-card>
          </v-col>
          <v-col v-if="availableMembers.length === 0" cols="12">
            <div class="text-center text-grey py-4">
              All crew members are assigned
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Board Content -->
    <v-card class="capacity-board">
      <v-card-title class="d-flex align-center py-3">
        <v-icon start>mdi-view-column</v-icon>
        <span>Capacity Allocation</span>
        <v-spacer />
        <v-chip size="small" color="primary" variant="tonal">
          {{ initiatives.length }} initiatives
        </v-chip>
      </v-card-title>

      <v-divider />

      <!-- Empty state -->
      <v-card-text v-if="initiatives.length === 0" class="text-center py-12">
        <v-icon size="64" color="grey-lighten-1">mdi-clipboard-outline</v-icon>
        <div class="text-h6 mt-4">No Initiatives</div>
        <div class="text-body-2 text-grey">
          Add initiatives to see capacity allocation on the board
        </div>
        <v-btn
          color="primary"
          variant="tonal"
          class="mt-4"
          to="/initiatives"
        >
          Go to Initiatives
        </v-btn>
      </v-card-text>

      <!-- Board table with scroll -->
      <div v-else class="board-scroll-container">
        <v-table dense class="board-table">
          <thead>
            <tr>
              <th class="initiative-header" style="min-width: 220px">
                Initiative
              </th>
              <th
                v-for="week in quarter?.totalWeeks || 13"
                :key="week"
                class="week-header text-center"
                :class="{ 'carryover-week': week > (quarter?.totalWeeks || 13) - 2 }"
              >
                W{{ week }}
              </th>
              <th class="actions-header" style="width: 80px">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <BoardRow
              v-for="initiative in initiatives"
              :key="initiative.id"
              :initiative="initiative"
              :quarter="quarter"
              :members="members"
              :dragged-member="draggedMember"
              @edit-assignment="$emit('edit-assignment', $event)"
              @add-assignment="$emit('add-assignment', $event)"
              @drop-member="handleDropMember"
            />
          </tbody>
        </v-table>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Initiative, QuarterConfig, TeamMember } from '~/types'
import { useMembersStore } from '~/stores/members'
import { useInitiativesStore } from '~/stores/initiatives'
import { calculateMemberQuarterCapacity } from '~/utils/capacityCalculator'
import BoardRow from './BoardRow.vue'

const props = defineProps<{
  quarter: QuarterConfig | undefined
  initiatives: Initiative[]
  members: TeamMember[]
}>()

const emit = defineEmits<{
  'edit-assignment': [payload: { initiative: Initiative; assignmentIndex: number }]
  'add-assignment': [payload: { initiative: Initiative; memberId: string; role: string }]
}>()

const membersStore = useMembersStore()
const initiativesStore = useInitiativesStore()

// Drag state
const draggedMember = ref<TeamMember | null>(null)

// Get available members (those with remaining capacity)
const availableMembers = computed(() => {
  if (!props.quarter) return props.members

  return props.members.filter((member) => {
    const capacity = calculateMemberQuarterCapacity(
      member,
      initiativesStore.initiatives,
      props.quarter!.id
    )
    return capacity.remaining > 0
  }).sort((a, b) => {
    const capA = calculateMemberQuarterCapacity(a, initiativesStore.initiatives, props.quarter!.id)
    const capB = calculateMemberQuarterCapacity(b, initiativesStore.initiatives, props.quarter!.id)
    return capB.remaining - capA.remaining
  })
})

// Get allocated weeks for a member
function getAllocatedWeeks(memberId: string): number {
  if (!props.quarter) return 0
  const member = props.members.find((m) => m.id === memberId)
  if (!member) return 0
  const capacity = calculateMemberQuarterCapacity(member, initiativesStore.initiatives, props.quarter.id)
  return capacity.allocated
}

// Drag handlers
function handleDragStart(event: DragEvent, member: TeamMember) {
  draggedMember.value = member
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'assign'
    event.dataTransfer.setData('text/plain', member.id)
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'member',
      memberId: member.id,
      roles: member.roles,
    }))
  }
}

function handleDragEnd() {
  draggedMember.value = null
}

function handleDropMember(payload: { initiative: Initiative; memberId: string; role: string }) {
  emit('add-assignment', payload)
}

// Helper functions
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getMemberColor(name: string): string {
  const colors = ['primary', 'secondary', 'success', 'warning', 'info', 'error']
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

function getRoleColor(role: string): string {
  const roleColors: Record<string, string> = {
    BE: 'blue',
    FE: 'green',
    MOBILE: 'orange',
    QA: 'purple',
  }
  return roleColors[role.toUpperCase()] || 'grey'
}
</script>

<style scoped>
.capacity-board-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.member-pool {
  flex-shrink: 0;
}

.member-pool-card {
  cursor: grab;
  transition: all 0.2s ease;
  user-select: none;
}

.member-pool-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.member-pool-card:active {
  cursor: grabbing;
}

.capacity-board {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.board-scroll-container {
  flex: 1;
  overflow: auto;
  max-height: 60vh;
}

.board-table {
  width: 100%;
}

.initiative-header {
  position: sticky;
  left: 0;
  background: white;
  z-index: 2;
}

.week-header {
  min-width: 60px;
  font-size: 0.75rem;
}

.carryover-week {
  background-color: #fff8e1;
}

.actions-header {
  position: sticky;
  right: 0;
  background: white;
  z-index: 2;
}

:deep(.v-table__wrapper) {
  overflow: visible;
}

:deep(thead th) {
  background: #f5f5f5;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 1;
}

:deep(tbody td) {
  padding: 4px 8px;
}
</style>
