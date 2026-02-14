<template>
  <div class="member-list">
    <!-- Loading state -->
    <div v-if="loading" class="d-flex justify-center align-center py-12">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      />
    </div>

    <!-- Empty state -->
    <v-alert
      v-else-if="members.length === 0"
      type="info"
      variant="tonal"
      class="my-4"
    >
      <v-alert-title>No team members yet</v-alert-title>
      <p>Create your first team member to start planning capacity.</p>
    </v-alert>

    <!-- Members grid -->
    <v-row v-else>
      <v-col
        v-for="member in members"
        :key="member.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <MemberCard
          :member="member"
          :edit-mode="editMode"
          @click="$emit('select', $event)"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TeamMember } from '~/types'
import MemberCard from './MemberCard.vue'

interface Props {
  members: TeamMember[]
  loading?: boolean
  editMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  editMode: true,
})

defineEmits<{
  select: [id: string]
  edit: [id: string]
  delete: [id: string]
}>()
</script>

<style scoped>
.member-list {
  min-height: 200px;
}
</style>
