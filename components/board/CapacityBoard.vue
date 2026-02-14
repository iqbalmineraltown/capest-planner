<template>
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

    <!-- Board content -->
    <v-table v-else dense class="board-table">
      <thead>
        <tr>
          <th class="initiative-header" style="min-width: 200px">
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
          @edit-assignment="$emit('edit-assignment', $event)"
          @add-assignment="$emit('add-assignment', $event)"
        />
      </tbody>
    </v-table>
  </v-card>
</template>

<script setup lang="ts">
import type { Initiative, QuarterConfig, TeamMember } from '~/types'
import BoardRow from './BoardRow.vue'

defineProps<{
  quarter: QuarterConfig | undefined
  initiatives: Initiative[]
  members: TeamMember[]
}>()

defineEmits<{
  'edit-assignment': [payload: { initiative: Initiative; assignmentIndex: number }]
  'add-assignment': [initiative: Initiative]
}>()
</script>

<style scoped>
.capacity-board {
  overflow-x: auto;
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
  overflow-x: auto;
}

:deep(thead th) {
  background: #f5f5f5;
  font-weight: 600;
}

:deep(tbody td) {
  padding: 4px 8px;
}
</style>
