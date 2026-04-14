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
          color="secondary"
          variant="outlined"
          density="compact"
          rounded="lg"
          :to="{ path: '/initiatives', query: { quarter: $route.query.quarter } }"
        >
          <v-icon start>mdi-plus</v-icon>
          Add Initiative
        </v-btn>
        <v-btn
          color="secondary"
          variant="outlined"
          density="compact"
          rounded="lg"
          :to="{ path: '/members', query: { quarter: $route.query.quarter } }"
        >
          <v-icon start>mdi-account-plus</v-icon>
          Add Member
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
      @edit-member="openMemberEditDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Initiative, Assignment, QuarterCapacitySummary } from '~/types'
import { useQuartersStore } from '~/stores/quarters'
import { useInitiativesStore } from '~/stores/initiatives'
import { useMembersStore } from '~/stores/members'
import { calculateQuarterCapacitySummary } from '~/utils/capacityCalculator'
import CapacityBoard from '~/components/board/CapacityBoard.vue'
import QuarterSummary from '~/components/board/QuarterSummary.vue'
import AssignmentDialog from '~/components/board/AssignmentDialog.vue'
import MemberForm from '~/components/members/MemberForm.vue'
import { useToast } from '~/composables/useToast'

const quartersStore = useQuartersStore()
const initiativesStore = useInitiativesStore()
const membersStore = useMembersStore()
const toast = useToast()

// State
const selectedQuarterId = ref<string>(quartersStore.currentQuarter?.id || '')
const showAddQuarterDialog = ref(false)
const showAssignmentDialog = ref(false)
const showMemberDialog = ref(false)
const selectedInitiative = ref<Initiative | null>(null)
const editingAssignment = ref<Assignment | null>(null)
const editingAssignmentIndex = ref<number>(-1)
const editingMemberId = ref<string | null>(null)
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

// Member edit handlers
function openMemberEditDialog(memberId: string) {
  editingMemberId.value = memberId
  showMemberDialog.value = true
}

function closeMemberDialog() {
  showMemberDialog.value = false
  editingMemberId.value = null
}

function handleMemberSubmit() {
  toast.success('Member updated successfully')
  closeMemberDialog()
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
  color: rgb(var(--v-theme-on-background));
  margin: 0;
  letter-spacing: -0.3px;
}

.board-page__subtitle {
  font-size: 0.88rem;
  color: rgb(var(--v-theme-on-background), 0.5);
  margin: 2px 0 0;
}

.board-page__actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* Responsive: stack header on small screens */
@media (max-width: 768px) {
  .board-page__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .board-page__actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .board-page__actions .v-select {
    min-width: 120px !important;
    flex: 1;
  }
}
</style>