<template>
  <div class="members-page">
    <!-- Page header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h1 class="text-h4 font-weight-bold">Team Members</h1>
        <p class="text-grey-darken-1">Manage your team capacity and roles</p>
      </div>
      <v-btn
        color="primary"
        variant="elevated"
        prepend-icon="mdi-plus"
        @click="openCreateDialog"
      >
        Add Member
      </v-btn>
    </div>

    <!-- Stats cards -->
    <v-row class="mb-4">
      <v-col cols="12" sm="4">
        <v-card variant="tonal" color="primary">
          <v-card-text class="d-flex align-center">
            <v-icon icon="mdi-account-group" size="large" class="mr-3" />
            <div>
              <div class="text-h4 font-weight-bold">{{ membersStore.memberCount }}</div>
              <div class="text-caption text-grey-darken-1">Total Members</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card variant="tonal" color="success">
          <v-card-text class="d-flex align-center">
            <v-icon icon="mdi-clock-outline" size="large" class="mr-3" />
            <div>
              <div class="text-h4 font-weight-bold">{{ totalAvailability }}</div>
              <div class="text-caption text-grey-darken-1">Total Manweeks</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card variant="tonal" color="info">
          <v-card-text class="d-flex align-center">
            <v-icon icon="mdi-briefcase-outline" size="large" class="mr-3" />
            <div>
              <div class="text-h4 font-weight-bold">{{ assignedCount }}</div>
              <div class="text-caption text-grey-darken-1">Active Assignments</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Members list -->
    <MemberList
      :members="membersStore.members"
      :loading="loading"
      edit-mode
      @edit="openEditDialog"
      @delete="confirmDelete"
    />

    <!-- Form dialog -->
    <v-dialog v-model="dialogOpen" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <span class="text-h5">{{ editingMemberId ? 'Edit' : 'Add' }} Team Member</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
        </v-card-title>

        <v-card-text>
          <MemberForm
            :member-id="editingMemberId"
            @submit="handleMemberSubmit"
            @cancel="closeDialog"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialogOpen" max-width="500" persistent>
      <v-card>
        <v-card-title class="text-h6">
          <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
          Delete Team Member
        </v-card-title>

        <v-card-text>
          Are you sure you want to delete {{ memberToDelete?.name }}? This action cannot be undone.
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialogOpen = false">
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="handleDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMembersStore } from '~/stores/members'
import type { TeamMember } from '~/types'

const membersStore = useMembersStore()

// State
const loading = ref(false)
const dialogOpen = ref(false)
const editingMemberId = ref<string | null>(null)
const deleteDialogOpen = ref(false)
const memberToDelete = ref<TeamMember | null>(null)

// Computed stats
const totalAvailability = computed(() =>
  membersStore.members.reduce((sum, m) => sum + m.availability, 0)
)

const assignedCount = computed(() =>
  membersStore.members.reduce((sum, m) => sum + m.assignedInitiatives.length, 0)
)

// Open create dialog
function openCreateDialog() {
  editingMemberId.value = null
  dialogOpen.value = true
}

// Open edit dialog
function openEditDialog(id: string) {
  editingMemberId.value = id
  dialogOpen.value = true
}

// Close dialog
function closeDialog() {
  dialogOpen.value = false
  editingMemberId.value = null
}

// Handle member form submission
function handleMemberSubmit(member: TeamMember) {
  dialogOpen.value = false
  editingMemberId.value = null
}

// Confirm delete
function confirmDelete(id: string) {
  const member = membersStore.getMemberById.value(id)
  if (member) {
    memberToDelete.value = member
    deleteDialogOpen.value = true
  }
}

// Handle delete
function handleDelete() {
  if (memberToDelete.value) {
    membersStore.removeMember(memberToDelete.value.id)
    memberToDelete.value = null
    deleteDialogOpen.value = false
  }
}
</script>

<style scoped>
.members-page {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
