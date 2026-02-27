<template>
  <div class="quarter-summary-bar">
    <div class="summary-card summary-card--quarter">
      <v-icon size="22" color="primary" class="summary-card__icon">mdi-calendar-range</v-icon>
      <div>
        <span class="summary-card__label">Quarter</span>
        <span class="summary-card__value text-primary">{{ quarter.label }}</span>
      </div>
    </div>

    <div class="summary-card">
      <div class="summary-card__ring" :style="ringStyle">
        <span class="summary-card__ring-text">{{ utilizationPercent.toFixed(0) }}%</span>
      </div>
      <div>
        <span class="summary-card__label">Utilization</span>
        <span class="summary-card__value" :class="utilizationTextClass">
          {{ summary?.totalAllocated || 0 }} / {{ summary?.totalAvailable || 0 }}
        </span>
      </div>
    </div>

    <div class="summary-card">
      <div class="summary-card__stat">
        <span class="summary-card__stat-number" :class="remainingClass">{{ remaining }}</span>
        <span class="summary-card__stat-unit">mw</span>
      </div>
      <div>
        <span class="summary-card__label">Remaining</span>
        <span class="summary-card__value text-grey">manweeks free</span>
      </div>
    </div>

    <!-- Alerts -->
    <div v-if="overAllocatedCount > 0" class="summary-alert summary-alert--warning">
      <v-icon size="16" color="warning">mdi-alert-circle</v-icon>
      <span>{{ overAllocatedCount }} over-allocated</span>
    </div>

    <div v-if="unassignedCount > 0" class="summary-alert summary-alert--info">
      <v-icon size="16" color="info">mdi-information</v-icon>
      <span>{{ unassignedCount }} unfilled roles</span>
    </div>
  </div>
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

const utilizationTextClass = computed(() => {
  const pct = utilizationPercent.value
  if (pct > 100) return 'text-error'
  if (pct > 90) return 'text-warning'
  return 'text-success'
})

const remainingClass = computed(() => {
  if (remaining.value < 0) return 'text-error'
  if (remaining.value < 5) return 'text-warning'
  return 'text-success'
})

const ringStyle = computed(() => {
  const pct = Math.min(100, utilizationPercent.value)
  let color = '#4CAF50'
  if (pct > 100) color = '#E53935'
  else if (pct > 90) color = '#FFC107'
  else if (pct < 30) color = '#1976D2'
  return {
    background: `conic-gradient(${color} ${pct * 3.6}deg, #e0e0e0 ${pct * 3.6}deg)`,
  }
})

const overAllocatedCount = computed(() => props.summary?.overAllocatedMembers.length || 0)
const unassignedCount = computed(() => props.summary?.unassignedRequirements.length || 0)
</script>

<style scoped>
.quarter-summary-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 20px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e8ecf1;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  flex-wrap: wrap;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-card__icon {
  flex-shrink: 0;
}

.summary-card__label {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9e9e9e;
}

.summary-card__value {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
}

/* Utilization ring */
.summary-card__ring {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.summary-card__ring::before {
  content: '';
  position: absolute;
  inset: 5px;
  background: #fff;
  border-radius: 50%;
}

.summary-card__ring-text {
  position: relative;
  font-size: 0.7rem;
  font-weight: 700;
  color: #333;
}

/* Stat number */
.summary-card__stat {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.summary-card__stat-number {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1;
}

.summary-card__stat-unit {
  font-size: 0.7rem;
  color: #9e9e9e;
  font-weight: 500;
}

/* Alerts */
.summary-alert {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
}

.summary-alert--warning {
  background: #FFF8E1;
  color: #F57F17;
}

.summary-alert--info {
  background: #E3F2FD;
  color: #1565C0;
}

/* Dark theme */
.v-theme--dark .quarter-summary-bar {
  background: #1e1e2e;
  border-color: #2d2d44;
}

.v-theme--dark .summary-card__ring::before {
  background: #1e1e2e;
}

.v-theme--dark .summary-card__ring-text {
  color: #e0e0e0;
}

.v-theme--dark .summary-alert--warning {
  background: #3e2b0a;
}

.v-theme--dark .summary-alert--info {
  background: #0a2540;
}
</style>
