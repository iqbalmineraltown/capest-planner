<template>
  <div class="board-page">
    <!-- Page Header -->
    <div class="board-page__header">
      <div>
        <h1 class="board-page__title">Capacity Board</h1>
        <p class="board-page__subtitle">Visualize and manage team capacity allocation</p>
      </div>
      <div class="board-page__actions">
        <v-select
          v-model="selectedQuarterId"
          :items="quarterOptions"
          label="Quarter"
          density="compact"
          variant="outlined"
          hide-details
          rounded="lg"
          style="min-width: 160px"
        />
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
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
      <v-card rounded="xl">
        <v-card-title class="pt-5 px-5 font-weight-bold">Add New Quarter</v-card-title>
        <v-card-text class="px-5">
          <v-row>
            <v-col cols="6">
              <v-select
                v-model="newQuarterYear"
                :items="yearOptions"
                label="Year"
                variant="outlined"
                density="comfortable"
                rounded="lg"
              />
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="newQuarterNumber"
                :items="[1, 2, 3, 4]"
                label="Quarter"
                variant="outlined"
                density="comfortable"
                rounded="lg"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="px-5 pb-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="showAddQuarterDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
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
import { useToast } from '~/composables/useToast'

const quartersStore = useQuartersStore()
const initiativesStore = useInitiativesStore()
const membersStore = useMembersStore()
const toast = useToast()

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

const currentYear = new Date().getFullYear()
const newQuarterYear = ref(currentYear)
const newQuarterNumber = ref(1)

// Computed
const selectedQuarter = computed(() => quartersStore.getQuarterById(selectedQuarterId.value))
const quarterOptions = computed(() =>
  quartersStore.sortedQuarters.map((q) => ({ title: q.label, value: q.id }))
)
const yearOptions = computed(() => [currentYear - 1, currentYear, currentYear + 1, currentYear + 2])
const quarterInitiatives = computed(() => initiativesStore.getInitiativesByQuarter(selectedQuarterId.value))

const quarterSummary = computed<QuarterCapacitySummary | null>(() => {
  const quarter = selectedQuarter.value
  if (!quarter) return null
  return calculateQuarterCapacitySummary(membersStore.members, initiativesStore.initiatives, quarter)
})

// Watch for default quarter
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
  const q = quartersStore.addQuarter(newQuarterYear.value, newQuarterNumber.value)
  if (q) {
    selectedQuarterId.value = q.id
    toast.success(`Quarter ${q.label} added`)
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

function handleAddAssignment(
  payload: { initiative: Initiative; memberId?: string; role?: string; startWeek?: number } | Initiative
) {
  if ('memberId' in payload && payload.memberId) {
    selectedInitiative.value = payload.initiative
    editingAssignmentIndex.value = -1
    editingAssignment.value = null
    initialMemberId.value = payload.memberId
    initialRole.value = payload.role || ''
    initialStartWeek.value = payload.startWeek || 1
  } else {
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

  const isEdit = editingAssignmentIndex.value >= 0
  if (isEdit) {
    initiativesStore.updateAssignment(selectedInitiative.value.id, editingAssignmentIndex.value, assignment)
  } else {
    initiativesStore.addAssignment(selectedInitiative.value.id, assignment)
    membersStore.assignToInitiative(assignment.memberId, selectedInitiative.value.id)
  }

  toast.success(isEdit ? 'Assignment updated' : 'Assignment added')
  showAssignmentDialog.value = false
  selectedInitiative.value = null
  editingAssignment.value = null
  initialMemberId.value = ''
  initialRole.value = ''
  initialStartWeek.value = 1
}

function handleDeleteAssignment() {
  if (!selectedInitiative.value || editingAssignmentIndex.value < 0) return

  const a = selectedInitiative.value.assignments[editingAssignmentIndex.value]
  membersStore.unassignFromInitiative(a.memberId, selectedInitiative.value.id)
  initiativesStore.removeAssignment(selectedInitiative.value.id, editingAssignmentIndex.value)

  toast.success('Assignment removed')
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
  height: 100%;
  display: flex;
  flex-direction: column;
  animation: board-fade-in 0.35s ease;
}

@keyframes board-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.board-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.board-page__title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #1a1a2e;
  margin: 0;
  letter-spacing: -0.3px;
}

.board-page__subtitle {
  font-size: 0.88rem;
  color: #9e9e9e;
  margin: 2px 0 0;
}

.board-page__actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.v-theme--dark .board-page__title {
  color: #e0e0e0;
}
</style>
