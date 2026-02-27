<template>
  <div class="capacity-board-layout">
    <!-- ═══ MEMBER POOL: Collapsible Sidebar ═══ -->
    <transition name="sidebar-slide">
      <aside
        v-show="isSidebarOpen"
        class="member-sidebar"
        :class="{ 'member-sidebar--collapsed': !isSidebarOpen }"
      >
        <div class="member-sidebar__header">
          <div class="member-sidebar__title">
            <v-icon size="20" class="mr-2">mdi-account-group</v-icon>
            <span>Team Pool</span>
          </div>
          <v-chip size="x-small" color="primary" variant="tonal">
            {{ availableMembers.length }}
          </v-chip>
          <v-spacer />
          <v-btn icon size="x-small" variant="text" @click="isSidebarOpen = false">
            <v-icon size="18">mdi-chevron-left</v-icon>
          </v-btn>
        </div>

        <!-- Search -->
        <div class="member-sidebar__search">
          <v-text-field
            v-model="memberSearch"
            placeholder="Search members..."
            variant="outlined"
            density="compact"
            hide-details
            prepend-inner-icon="mdi-magnify"
            clearable
          />
        </div>

        <!-- Member Cards -->
        <div class="member-sidebar__list">
          <div
            v-for="member in filteredMembers"
            :key="member.id"
            class="member-pool-card"
            draggable="true"
            @dragstart="handleMemberDragStart($event, member)"
            @dragend="handleDragEnd"
          >
            <div class="member-pool-card__left">
              <div
                class="member-pool-card__avatar"
                :style="{ backgroundColor: getMemberAvatarBg(member.name), color: getMemberAvatarColor(member.name) }"
              >
                {{ getInitials(member.name) }}
              </div>
              <div class="member-pool-card__info">
                <span class="member-pool-card__name">{{ member.name }}</span>
                <div class="member-pool-card__roles">
                  <span
                    v-for="role in member.roles.slice(0, 3)"
                    :key="role"
                    class="member-pool-card__role-tag"
                    :style="{ color: getRoleHex(role), backgroundColor: getRoleHex(role) + '18' }"
                  >
                    {{ role }}
                  </span>
                </div>
              </div>
            </div>

            <div class="member-pool-card__capacity">
              <div class="member-pool-card__capacity-text">
                {{ getRemainingWeeks(member.id) }}/{{ member.availability }}w
              </div>
              <div class="member-pool-card__capacity-bar">
                <div
                  class="member-pool-card__capacity-fill"
                  :style="{
                    width: getCapacityPercent(member.id) + '%',
                    backgroundColor: getCapacityBarColor(member.id),
                  }"
                />
              </div>
            </div>
          </div>

          <div v-if="filteredMembers.length === 0" class="member-sidebar__empty">
            <v-icon size="32" color="grey-lighten-1">mdi-account-off</v-icon>
            <span>No members match</span>
          </div>
        </div>
      </aside>
    </transition>

    <!-- ═══ Sidebar Toggle (when collapsed) ═══ -->
    <v-btn
      v-if="!isSidebarOpen"
      icon
      size="small"
      variant="tonal"
      color="primary"
      class="sidebar-toggle-btn"
      @click="isSidebarOpen = true"
    >
      <v-icon size="18">mdi-account-group</v-icon>
    </v-btn>

    <!-- ═══ MAIN BOARD ═══ -->
    <div class="board-main">
      <!-- Empty state -->
      <div v-if="initiatives.length === 0" class="board-empty">
        <v-icon size="80" color="grey-lighten-2">mdi-clipboard-text-outline</v-icon>
        <h3 class="mt-4 text-grey-darken-1">No Initiatives Yet</h3>
        <p class="text-grey mt-1">Create initiatives to start planning capacity</p>
        <v-btn
          color="primary"
          variant="tonal"
          class="mt-4"
          prepend-icon="mdi-plus"
          to="/initiatives"
        >
          Add Initiative
        </v-btn>
      </div>

      <!-- Board with week header + swimlanes -->
      <template v-else>
        <!-- Sticky week header bar -->
        <div class="board-week-header">
          <div class="board-week-header__label">Initiative</div>
          <div class="board-week-header__weeks">
            <div
              v-for="week in totalWeeks"
              :key="week"
              class="board-week-header__week"
              :class="{ 'board-week-header__week--carryover': week > totalWeeks - 2 }"
            >
              W{{ week }}
            </div>
          </div>
        </div>

        <!-- Swimlane rows -->
        <div class="board-swimlanes">
          <BoardRow
            v-for="initiative in initiatives"
            :key="initiative.id"
            :initiative="initiative"
            :quarter="quarter"
            :members="members"
            :dragged-member="dragState?.type === 'member' ? (dragState.data as TeamMember) : null"
            :all-initiatives="allInitiatives"
            @edit-assignment="$emit('edit-assignment', $event)"
            @add-assignment="$emit('add-assignment', $event)"
            @drop-member="handleDropMember"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Initiative, QuarterConfig, TeamMember } from '~/types'
import { useInitiativesStore } from '~/stores/initiatives'
import { calculateMemberQuarterCapacity } from '~/utils/capacityCalculator'
import { useBoardDragDrop } from '~/composables/useBoardDragDrop'
import BoardRow from './BoardRow.vue'

const props = defineProps<{
  quarter: QuarterConfig | undefined
  initiatives: Initiative[]
  members: TeamMember[]
}>()

const emit = defineEmits<{
  'edit-assignment': [payload: { initiative: Initiative; assignmentIndex: number }]
  'add-assignment': [payload: { initiative: Initiative; memberId?: string; role?: string; startWeek?: number } | Initiative]
}>()

const initiativesStore = useInitiativesStore()
const { dragState, startMemberDrag, endDrag } = useBoardDragDrop()

const allInitiatives = computed(() => initiativesStore.initiatives)
const totalWeeks = computed(() => props.quarter?.totalWeeks || 13)

// ─── Sidebar state ──────────────────────────────────────────
const isSidebarOpen = ref(true)
const memberSearch = ref('')

const availableMembers = computed(() => {
  if (!props.quarter) return props.members
  return props.members
    .filter((m) => {
      const cap = calculateMemberQuarterCapacity(m, initiativesStore.initiatives, props.quarter!.id)
      return cap.remaining > 0
    })
    .sort((a, b) => {
      const capA = calculateMemberQuarterCapacity(a, initiativesStore.initiatives, props.quarter!.id)
      const capB = calculateMemberQuarterCapacity(b, initiativesStore.initiatives, props.quarter!.id)
      return capB.remaining - capA.remaining
    })
})

const filteredMembers = computed(() => {
  if (!memberSearch.value) return availableMembers.value
  const q = memberSearch.value.toLowerCase()
  return availableMembers.value.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.roles.some((r) => r.toLowerCase().includes(q))
  )
})

// ─── Member helpers ─────────────────────────────────────────
function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

const avatarColors = [
  { bg: '#E3F2FD', fg: '#1565C0' },
  { bg: '#E8F5E9', fg: '#2E7D32' },
  { bg: '#FFF3E0', fg: '#E65100' },
  { bg: '#F3E5F5', fg: '#7B1FA2' },
  { bg: '#E0F7FA', fg: '#00838F' },
  { bg: '#FBE9E7', fg: '#BF360C' },
]

function getMemberAvatarBg(name: string): string {
  return avatarColors[name.charCodeAt(0) % avatarColors.length].bg
}

function getMemberAvatarColor(name: string): string {
  return avatarColors[name.charCodeAt(0) % avatarColors.length].fg
}

const roleHexMap: Record<string, string> = {
  BE: '#1565C0',
  FE: '#2E7D32',
  MOBILE: '#E65100',
  QA: '#7B1FA2',
}

function getRoleHex(role: string): string {
  return roleHexMap[role.toUpperCase()] || '#546E7A'
}

function getRemainingWeeks(memberId: string): number {
  if (!props.quarter) return 0
  const member = props.members.find((m) => m.id === memberId)
  if (!member) return 0
  const cap = calculateMemberQuarterCapacity(member, initiativesStore.initiatives, props.quarter.id)
  return cap.remaining
}

function getCapacityPercent(memberId: string): number {
  if (!props.quarter) return 0
  const member = props.members.find((m) => m.id === memberId)
  if (!member || member.availability === 0) return 0
  const cap = calculateMemberQuarterCapacity(member, initiativesStore.initiatives, props.quarter.id)
  return Math.min(100, (cap.allocated / member.availability) * 100)
}

function getCapacityBarColor(memberId: string): string {
  const pct = getCapacityPercent(memberId)
  if (pct >= 100) return '#E53935'
  if (pct >= 80) return '#FFC107'
  if (pct >= 50) return '#4CAF50'
  return '#1976D2'
}

// ─── Drag handlers ──────────────────────────────────────────
function handleMemberDragStart(event: DragEvent, member: TeamMember) {
  startMemberDrag(member)

  if (event.dataTransfer) {
    // Required: browsers need data set for drag to work
    event.dataTransfer.effectAllowed = 'copyMove'
    event.dataTransfer.setData('text/plain', member.id)
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'member',
      memberId: member.id,
    }))

    // Create a custom drag ghost image
    const ghost = document.createElement('div')
    ghost.style.cssText = `
      padding: 8px 16px;
      background: #1976D2;
      color: #fff;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      white-space: nowrap;
      position: absolute;
      top: -1000px;
      pointer-events: none;
    `
    ghost.textContent = member.name
    document.body.appendChild(ghost)
    event.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2)
    // Remove ghost after a tick
    requestAnimationFrame(() => document.body.removeChild(ghost))
  }
}

function handleDragEnd() {
  endDrag()
}

function handleDropMember(payload: { initiative: Initiative; memberId: string; role: string; startWeek: number }) {
  emit('add-assignment', {
    initiative: payload.initiative,
    memberId: payload.memberId,
    role: payload.role,
    startWeek: payload.startWeek,
  })
}
</script>

<style scoped>
.capacity-board-layout {
  display: flex;
  gap: 16px;
  height: 100%;
  min-height: 0;
  position: relative;
}

/* ═══ SIDEBAR ═══ */
.member-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e8ecf1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.member-sidebar__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid #e8ecf1;
}

.member-sidebar__title {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 700;
  color: #1a1a2e;
}

.member-sidebar__search {
  padding: 10px 12px;
}

.member-sidebar__list {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-sidebar__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: #9e9e9e;
  font-size: 0.85rem;
}

/* ─── Member pool card ──────────────────────────────────── */
.member-pool-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f8f9fb;
  border-radius: 10px;
  cursor: grab;
  user-select: none;
  transition:
    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    background 0.15s ease;
  border: 1px solid transparent;
}

.member-pool-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  background: #fff;
  border-color: #e0e0e0;
}

.member-pool-card:active {
  cursor: grabbing;
  transform: scale(0.98);
}

/* Opacity for the source card while dragging */
.member-pool-card[draggable="true"]:active,
.member-pool-card--dragging {
  opacity: 0.5;
  transform: scale(0.96);
}

.member-pool-card__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.member-pool-card__avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.member-pool-card__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.member-pool-card__name {
  font-size: 0.82rem;
  font-weight: 600;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-pool-card__roles {
  display: flex;
  gap: 4px;
  margin-top: 2px;
}

.member-pool-card__role-tag {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 1px 5px;
  border-radius: 4px;
}

.member-pool-card__capacity {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.member-pool-card__capacity-text {
  font-size: 0.7rem;
  color: #666;
  font-weight: 500;
}

.member-pool-card__capacity-bar {
  width: 48px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}

.member-pool-card__capacity-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* Sidebar slide animation */
.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-slide-enter-from,
.sidebar-slide-leave-to {
  width: 0;
  opacity: 0;
  margin-right: -16px;
}

.sidebar-toggle-btn {
  position: absolute;
  left: 0;
  top: 8px;
  z-index: 5;
  border-radius: 0 8px 8px 0;
}

/* ═══ MAIN BOARD ═══ */
.board-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.board-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 32px;
  text-align: center;
}

/* ─── Week header bar ────────────────────────────────────── */
.board-week-header {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px 12px 0 0;
  border: 1px solid #e8ecf1;
  border-bottom: 2px solid #e0e0e0;
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.board-week-header__label {
  width: 200px;
  flex-shrink: 0;
  padding: 10px 16px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-right: 1px solid #e8ecf1;
}

.board-week-header__weeks {
  display: flex;
  gap: 6px;
  padding: 10px 8px;
  overflow-x: auto;
  min-width: max-content;
}

.board-week-header__week {
  flex: 0 0 120px;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #888;
  padding: 4px 0;
  border-radius: 6px;
}

.board-week-header__week--carryover {
  background: #fff8e1;
  color: #f57f17;
}

/* ─── Swimlanes container ────────────────────────────────── */
.board-swimlanes {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ═══ Dark theme ═══ */
.v-theme--dark .member-sidebar {
  background: #1e1e2e;
  border-color: #2d2d44;
}

.v-theme--dark .member-sidebar__title {
  color: #e0e0e0;
}

.v-theme--dark .member-pool-card {
  background: #16213e;
}

.v-theme--dark .member-pool-card:hover {
  background: #1a2744;
  border-color: #3d3d5c;
}

.v-theme--dark .member-pool-card__name {
  color: #e0e0e0;
}

.v-theme--dark .board-week-header {
  background: #1e1e2e;
  border-color: #2d2d44;
}

.v-theme--dark .board-week-header__label {
  color: #9e9e9e;
}

.v-theme--dark .board-week-header__week {
  color: #9e9e9e;
}
</style>
