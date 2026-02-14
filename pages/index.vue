<template>
  <div class="dashboard-page">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Dashboard</h1>
        <p class="text-grey-darken-1">Overview of your capacity planning</p>
      </div>
      <v-chip color="primary" variant="tonal" size="large">
        <v-icon start>mdi-calendar</v-icon>
        {{ currentQuarterLabel }}
      </v-chip>
    </div>

    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" variant="tonal" color="primary">
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar color="primary" size="56" class="mr-4">
                <v-icon size="large">mdi-account-group</v-icon>
              </v-avatar>
              <div>
                <div class="text-h4 font-weight-bold">{{ memberCount }}</div>
                <div class="text-caption text-grey-darken-1">Team Members</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" variant="tonal" color="success">
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar color="success" size="56" class="mr-4">
                <v-icon size="large">mdi-lightbulb</v-icon>
              </v-avatar>
              <div>
                <div class="text-h4 font-weight-bold">{{ initiativeCount }}</div>
                <div class="text-caption text-grey-darken-1">Initiatives</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" variant="tonal" color="info">
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar color="info" size="56" class="mr-4">
                <v-icon size="large">mdi-clock-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-h4 font-weight-bold">{{ totalCapacity }}</div>
                <div class="text-caption text-grey-darken-1">Total Manweeks</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" variant="tonal" :color="utilizationColor">
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar :color="utilizationColor" size="56" class="mr-4">
                <v-icon size="large">mdi-chart-arc</v-icon>
              </v-avatar>
              <div>
                <div class="text-h4 font-weight-bold">{{ utilizationPercent }}%</div>
                <div class="text-caption text-grey-darken-1">Utilization</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content -->
    <v-row>
      <!-- Current Quarter Overview -->
      <v-col cols="12" lg="8">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon start>mdi-view-dashboard</v-icon>
            Current Quarter Overview
            <v-spacer />
            <v-btn
              color="primary"
              variant="text"
              size="small"
              to="/board"
              append-icon="mdi-arrow-right"
            >
              View Board
            </v-btn>
          </v-card-title>
          <v-divider />

          <v-card-text v-if="currentQuarterSummary">
            <!-- Utilization Progress -->
            <div class="mb-6">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-body-2">Quarter Utilization</span>
                <span class="text-body-2 font-weight-medium">
                  {{ currentQuarterSummary.totalAllocated }} / {{ currentQuarterSummary.totalAvailable }} manweeks
                </span>
              </div>
              <v-progress-linear
                :model-value="utilizationPercent"
                :color="utilizationColor"
                height="10"
                rounded
              />
            </div>

            <!-- Member Capacity List -->
            <div class="mb-4">
              <div class="text-subtitle-1 font-weight-medium mb-3">
                Member Allocation
              </div>
              <v-list density="compact">
                <v-list-item
                  v-for="capacity in currentQuarterSummary.memberCapacities"
                  :key="capacity.memberId"
                  class="px-0"
                >
                  <template #prepend>
                    <v-avatar size="small" :color="getMemberColor(capacity.memberName)">
                      {{ getInitials(capacity.memberName) }}
                    </v-avatar>
                  </template>

                  <v-list-item-title>{{ capacity.memberName }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ capacity.allocated }} / {{ capacity.available }} weeks
                  </v-list-item-subtitle>

                  <template #append>
                    <v-progress-linear
                      :model-value="(capacity.allocated / capacity.available) * 100"
                      :color="capacity.isOverAllocated ? 'error' : 'success'"
                      width="80"
                      height="6"
                      rounded
                      class="ml-4"
                    />
                  </template>
                </v-list-item>
              </v-list>
            </div>

            <!-- Warnings -->
            <v-alert
              v-if="currentQuarterSummary.overAllocatedMembers.length > 0"
              type="warning"
              density="compact"
              variant="tonal"
              class="mb-2"
            >
              <v-icon start>mdi-alert</v-icon>
              {{ currentQuarterSummary.overAllocatedMembers.length }} member(s) are over-allocated
            </v-alert>

            <v-alert
              v-if="currentQuarterSummary.unassignedRequirements.length > 0"
              type="info"
              density="compact"
              variant="tonal"
            >
              <v-icon start>mdi-information</v-icon>
              {{ currentQuarterSummary.unassignedRequirements.length }} role(s) need assignment
            </v-alert>
          </v-card-text>

          <v-card-text v-else class="text-center py-8">
            <v-icon size="48" color="grey-lighten-1">mdi-calendar-blank</v-icon>
            <div class="text-body-1 mt-2">No quarter data available</div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Quick Actions & Recent Activity -->
      <v-col cols="12" lg="4">
        <!-- Quick Actions -->
        <v-card class="mb-4">
          <v-card-title>
            <v-icon start>mdi-lightning-bolt</v-icon>
            Quick Actions
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-list density="compact" nav>
              <v-list-item
                prepend-icon="mdi-account-plus"
                title="Add Team Member"
                to="/members"
              />
              <v-list-item
                prepend-icon="mdi-lightbulb-on"
                title="Create Initiative"
                to="/initiatives"
              />
              <v-list-item
                prepend-icon="mdi-view-column"
                title="Open Capacity Board"
                to="/board"
              />
              <v-list-item
                prepend-icon="mdi-calendar-plus"
                title="Add New Quarter"
                to="/board"
              />
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Role Distribution -->
        <v-card class="mb-4">
          <v-card-title>
            <v-icon start>mdi-chart-pie</v-icon>
            Role Distribution
          </v-card-title>
          <v-divider />
          <v-card-text>
            <div
              v-for="roleCount in roleDistribution"
              :key="roleCount.role"
              class="d-flex align-center mb-2"
            >
              <v-chip
                :color="roleCount.color"
                size="small"
                variant="flat"
                class="mr-3"
              >
                {{ roleCount.role }}
              </v-chip>
              <v-spacer />
              <span class="text-body-2">{{ roleCount.count }} members</span>
            </div>
            <div v-if="roleDistribution.length === 0" class="text-center text-grey py-4">
              No members added yet
            </div>
          </v-card-text>
        </v-card>

        <!-- Recent Initiatives -->
        <v-card>
          <v-card-title>
            <v-icon start>mdi-history</v-icon>
            Recent Initiatives
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-list density="compact">
              <v-list-item
                v-for="initiative in recentInitiatives"
                :key="initiative.id"
                :title="initiative.name"
                :subtitle="initiative.quarter"
                to="/initiatives"
              >
                <template #prepend>
                  <v-icon color="primary">mdi-lightbulb-outline</v-icon>
                </template>
              </v-list-item>
            </v-list>
            <div v-if="recentInitiatives.length === 0" class="text-center text-grey py-4">
              No initiatives yet
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMembersStore } from '~/stores/members'
import { useInitiativesStore } from '~/stores/initiatives'
import { useQuartersStore } from '~/stores/quarters'
import { useRolesStore } from '~/stores/roles'
import { useSeedData } from '~/composables/useSeedData'
import { calculateQuarterCapacitySummary } from '~/utils/capacityCalculator'
import { formatQuarterLabel, getCurrentQuarterId } from '~/utils/dateUtils'

const membersStore = useMembersStore()
const initiativesStore = useInitiativesStore()
const quartersStore = useQuartersStore()
const rolesStore = useRolesStore()
const { seedDefaultData } = useSeedData()

// Auto-seed default data on first load
onMounted(() => {
  seedDefaultData()
})

// Computed stats
const memberCount = computed(() => membersStore.memberCount)
const initiativeCount = computed(() => initiativesStore.initiativeCount)

const totalCapacity = computed(() =>
  membersStore.members.reduce((sum, m) => sum + m.availability, 0)
)

const currentQuarterLabel = computed(() => {
  const id = getCurrentQuarterId()
  return formatQuarterLabel(id)
})

const currentQuarterSummary = computed(() => {
  const quarter = quartersStore.currentQuarter
  if (!quarter) return null
  return calculateQuarterCapacitySummary(
    membersStore.members,
    initiativesStore.initiatives,
    quarter
  )
})

const utilizationPercent = computed(() => {
  if (!currentQuarterSummary.value || currentQuarterSummary.value.totalAvailable === 0) {
    return 0
  }
  const percent = (currentQuarterSummary.value.totalAllocated / currentQuarterSummary.value.totalAvailable) * 100
  return Math.round(percent)
})

const utilizationColor = computed(() => {
  const pct = utilizationPercent.value
  if (pct > 100) return 'error'
  if (pct > 90) return 'warning'
  if (pct > 70) return 'success'
  return 'primary'
})

// Role distribution
const roleColors: Record<string, string> = {
  BE: 'blue',
  FE: 'green',
  MOBILE: 'orange',
  QA: 'purple',
}

const roleDistribution = computed(() => {
  const counts: Record<string, number> = {}

  membersStore.members.forEach((member) => {
    member.roles.forEach((role) => {
      counts[role] = (counts[role] || 0) + 1
    })
  })

  return Object.entries(counts).map(([role, count]) => ({
    role,
    count,
    color: roleColors[role.toUpperCase()] || 'grey',
  }))
})

// Recent initiatives (last 5)
const recentInitiatives = computed(() =>
  initiativesStore.initiatives.slice(-5).reverse()
)

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
</script>

<style scoped>
.dashboard-page {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
