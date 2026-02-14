<template>
  <v-card class="quarter-summary" variant="tonal" color="grey-lighten-3">
    <v-card-text>
      <v-row>
        <!-- Quarter info -->
        <v-col cols="12" sm="3">
          <div class="summary-item">
            <v-icon color="primary" size="large">mdi-calendar</v-icon>
            <div class="ml-3">
              <div class="text-caption text-grey">Quarter</div>
              <div class="text-h6 font-weight-bold">{{ quarter.label }}</div>
            </div>
          </div>
        </v-col>

        <!-- Total capacity -->
        <v-col cols="6" sm="2">
          <div class="summary-item text-center">
            <div class="text-caption text-grey">Available</div>
            <div class="text-h5 font-weight-bold text-primary">
              {{ summary?.totalAvailable || 0 }}
            </div>
            <div class="text-caption">manweeks</div>
          </div>
        </v-col>

        <!-- Allocated -->
        <v-col cols="6" sm="2">
          <div class="summary-item text-center">
            <div class="text-caption text-grey">Allocated</div>
            <div class="text-h5 font-weight-bold" :class="allocationColor">
              {{ summary?.totalAllocated || 0 }}
            </div>
            <div class="text-caption">manweeks</div>
          </div>
        </v-col>

        <!-- Remaining -->
        <v-col cols="6" sm="2">
          <div class="summary-item text-center">
            <div class="text-caption text-grey">Remaining</div>
            <div class="text-h5 font-weight-bold" :class="remainingColor">
              {{ remaining }}
            </div>
            <div class="text-caption">manweeks</div>
          </div>
        </v-col>

        <!-- Utilization -->
        <v-col cols="6" sm="3">
          <div class="summary-item">
            <div class="text-caption text-grey mb-1">Utilization</div>
            <v-progress-linear
              :model-value="utilizationPercent"
              :color="utilizationColor"
              height="8"
              rounded
            />
            <div class="text-center text-caption mt-1">
              {{ utilizationPercent.toFixed(1) }}%
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- Warnings -->
      <v-row v-if="hasWarnings" class="mt-2">
        <v-col cols="12">
          <v-alert
            v-if="overAllocatedCount > 0"
            type="warning"
            density="compact"
            variant="tonal"
            class="mb-2"
          >
            <v-icon start>mdi-alert</v-icon>
            {{ overAllocatedCount }} member(s) over-allocated
          </v-alert>

          <v-alert
            v-if="unassignedCount > 0"
            type="info"
            density="compact"
            variant="tonal"
          >
            <v-icon start>mdi-information</v-icon>
            {{ unassignedCount }} role requirement(s) need assignment
          </v-alert>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { QuarterConfig, QuarterCapacitySummary } from '~/types'

const props = defineProps<{
  quarter: QuarterConfig
  summary: QuarterCapacitySummary | null
}>()

const remaining = computed(() => {
  if (!props.summary) return 0
  return props.summary.totalAvailable - props.summary.totalAllocated
})

const utilizationPercent = computed(() => {
  if (!props.summary || props.summary.totalAvailable === 0) return 0
  return (props.summary.totalAllocated / props.summary.totalAvailable) * 100
})

const utilizationColor = computed(() => {
  const pct = utilizationPercent.value
  if (pct > 100) return 'error'
  if (pct > 90) return 'warning'
  if (pct > 70) return 'success'
  return 'primary'
})

const allocationColor = computed(() => {
  if (!props.summary) return 'text-primary'
  const pct = utilizationPercent.value
  if (pct > 100) return 'text-error'
  if (pct > 90) return 'text-warning'
  return 'text-primary'
})

const remainingColor = computed(() => {
  if (remaining.value < 0) return 'text-error'
  if (remaining.value < 5) return 'text-warning'
  return 'text-success'
})

const overAllocatedCount = computed(() =>
  props.summary?.overAllocatedMembers.length || 0
)

const unassignedCount = computed(() =>
  props.summary?.unassignedRequirements.length || 0
)

const hasWarnings = computed(() =>
  overAllocatedCount.value > 0 || unassignedCount.value > 0
)
</script>

<style scoped>
.quarter-summary {
  border-radius: 12px;
}

.summary-item {
  display: flex;
  align-items: center;
}
</style>
