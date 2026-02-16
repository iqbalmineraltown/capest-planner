<template>
  <div class="board-page">
    <!-- Page header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h1 class="text-h4 font-weight-bold">Capacity Board</h1>
        <p class="text-grey-darken-1">Visualize and manage team capacity allocation</p>
      </div>
      <div class="d-flex ga-2">
        <v-select
          v-model="selectedQuarterId"
          :items="quarterOptions"
          label="Quarter"
          density="compact"
          variant="outlined"
          hide-details
          style="min-width: 150px"
        />
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-calendar-plus"
          @click="showAddQuarterDialog = true"
        >
          Add Quarter
        </v-btn>
      </div>
    </div>

    <!-- Quarter Summary -->
    <QuarterSummary
      v-if="selectedQuarter"
      :quarter="selectedQuarter"
      :summary="quarterSummary"
      class="mb-4"
    />

    <!-- Capacity Board -->
    <CapacityBoard
      :quarter="selectedQuarter"
      :initiatives="quarterInitiatives"
      :members="membersStore.members"
      @edit-assignment="openAssignmentDialog"
      @add-assignment="handleAddAssignment"
    />

    <!-- Add Quarter Dialog -->
    <v-dialog v-model="showAddQuarterDialog" max-width="400">
      <v-card>
        <v-card-title>Add New Quarter</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="6">
              <v-select
                v-model="newQuarterYear"
                :items="yearOptions"
                label="Year"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="newQuarterNumber"
                :items="[1, 2, 3, 4]"
                label="Quarter"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showAddQuarterDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!newQuarterYear || !newQuarterNumber"
            @click="handleAddQuarter"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Assignment Dialog -->
    <AssignmentDialog
      v-model="showAssignmentDialog"
      :initiative="selectedInitiative"
      :assignment="editingAssignment"
      :members="membersStore.members"
      :quarter="selectedQuarter"
      :initial-member-id="initialMemberId"
      :initial-role="initialRole"
      :initial-start-week="initialStartWeek"
      :all-initiatives="initiativesStore.initiatives"
      :exclude-initiative-id="selectedInitiative?.id"
      :exclude-assignment-index="editingAssignmentIndex"
      @save="handleSaveAssignment"
      @delete="handleDeleteAssignment"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Initiative, QuarterConfig, Assignment, QuarterCapacitySummary } from '~/types'
import { useQuartersStore } from '~/stores/quarters'
import { useInitiativesStore } from '~/stores/initiatives'
import { useMembersStore } from '~/stores/members'
import { calculateQuarterCapacitySummary } from '~/utils/capacityCalculator'
import CapacityBoard from '~/components/board/CapacityBoard.vue'
import QuarterSummary from '~/components/board/QuarterSummary.vue'
import AssignmentDialog from '~/components/board/AssignmentDialog.vue'

const quartersStore = useQuartersStore()
const initiativesStore = useInitiativesStore()
const membersStore = useMembersStore()

// State
const selectedQuarterId = ref<string>(quartersStore.currentQuarter?.id || '')
const showAddQuarterDialog = ref(false)
const showAssignmentDialog = ref(false)
const selectedInitiative = ref<Initiative | null>(null)
const editingAssignment = ref<Assignment | null>(null)
const editingAssignmentIndex = ref<number>(-1)
const initialMemberId = ref<string>('')
const initialRole = ref<string>('')
const initialStartWeek = ref<number>(1)

// New quarter form
const currentYear = new Date().getFullYear()
const newQuarterYear = ref(currentYear)
const newQuarterNumber = ref(1)

// Computed
const selectedQuarter = computed(() =>
  quartersStore.getQuarterById(selectedQuarterId.value)
)

const quarterOptions = computed(() =>
  quartersStore.sortedQuarters.map((q) => ({
    title: q.label,
    value: q.id,
  }))
)

const yearOptions = computed(() => {
  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2]
  return years
})

const quarterInitiatives = computed(() =>
  initiativesStore.getInitiativesByQuarter(selectedQuarterId.value)
)

const quarterSummary = computed<QuarterCapacitySummary | null>(() => {
  const quarter = selectedQuarter.value
  if (!quarter) return null
  return calculateQuarterCapacitySummary(
    membersStore.members,
    initiativesStore.initiatives,
    quarter
  )
})

// Initialize with current quarter
watch(
  () => quartersStore.currentQuarter,
  (quarter) => {
    if (quarter && !selectedQuarterId.value) {
      selectedQuarterId.value = quarter.id
    }
  },
  { immediate: true }
)

// Actions
function handleAddQuarter() {
  const newQuarter = quartersStore.addQuarter(newQuarterYear.value, newQuarterNumber.value)
  if (newQuarter) {
    selectedQuarterId.value = newQuarter.id
  }
  showAddQuarterDialog.value = false
}

function openAssignmentDialog(payload: { initiative: Initiative; assignmentIndex: number }) {
  selectedInitiative.value = payload.initiative
  editingAssignmentIndex.value = payload.assignmentIndex
  editingAssignment.value = { ...payload.initiative.assignments[payload.assignmentIndex] }
  initialMemberId.value = ''
  initialRole.value = ''
  showAssignmentDialog.value = true
}

function handleAddAssignment(payload: { initiative: Initiative; memberId?: string; role?: string; startWeek?: number } | Initiative) {
  // Handle both old format (just initiative) and new format (with memberId, role, and startWeek)
  if ('memberId' in payload && payload.memberId) {
    selectedInitiative.value = payload.initiative
    editingAssignmentIndex.value = -1
    editingAssignment.value = null
    initialMemberId.value = payload.memberId
    initialRole.value = payload.role || ''
    initialStartWeek.value = payload.startWeek || 1
  } else {
    // Old format - just initiative
    const initiative = 'initiative' in payload ? payload.initiative : payload
    selectedInitiative.value = initiative
    editingAssignmentIndex.value = -1
    editingAssignment.value = null
    initialMemberId.value = ''
    initialRole.value = ''
    initialStartWeek.value = 1
  }
  showAssignmentDialog.value = true
}

function handleSaveAssignment(assignment: Assignment) {
  if (!selectedInitiative.value) return

  if (editingAssignmentIndex.value >= 0) {
    // Update existing
    initiativesStore.updateAssignment(
      selectedInitiative.value.id,
      editingAssignmentIndex.value,
      assignment
    )
  } else {
    // Add new
    initiativesStore.addAssignment(selectedInitiative.value.id, assignment)
    // Update member's assigned initiatives
    membersStore.assignToInitiative(assignment.memberId, selectedInitiative.value.id)
  }

  showAssignmentDialog.value = false
  selectedInitiative.value = null
  editingAssignment.value = null
  initialMemberId.value = ''
  initialRole.value = ''
  initialStartWeek.value = 1
}

function handleDeleteAssignment() {
  if (!selectedInitiative.value || editingAssignmentIndex.value < 0) return

  const assignment = selectedInitiative.value.assignments[editingAssignmentIndex.value]
  membersStore.unassignFromInitiative(assignment.memberId, selectedInitiative.value.id)
  initiativesStore.removeAssignment(selectedInitiative.value.id, editingAssignmentIndex.value)

  showAssignmentDialog.value = false
  selectedInitiative.value = null
  editingAssignment.value = null
  initialMemberId.value = ''
  initialRole.value = ''
  initialStartWeek.value = 1
}
</script>

<style scoped>
.board-page {
  animation: fadeIn 0.3s ease-in-out;
  height: 100%;
  display: flex;
  flex-direction: column;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
