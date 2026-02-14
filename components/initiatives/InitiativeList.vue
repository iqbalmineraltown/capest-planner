<template>
  <div class="initiative-list">
    <div v-if="filteredInitiatives.length === 0" class="empty-state">
      <v-icon size="80" color="grey-lighten-2" class="mb-4">
        mdi-lightbulb-on-outline
      </v-icon>
      <h3 class="text-h6 text-grey-lighten-1 mb-2">No Initiatives Found</h3>
      <p class="text-body-2 text-medium-emphasis">
        {{ quarterFilter
          ? `No initiatives planned for ${quarterLabel}.`
          : 'No initiatives have been created yet.' }}
      </p>
    </div>

    <div v-else>
      <v-row v-if="displayMode === 'grid'" dense>
        <v-col
          v-for="initiative in filteredInitiatives"
          :key="initiative.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <InitiativeCard
            :initiative="initiative"
            :readonly="readonly"
            :selected-id="selectedId"
            @edit="$emit('edit', $event)"
            @delete="$emit('delete', $event)"
            @click="$emit('select', $event)"
          />
        </v-col>
      </v-row>

      <v-list v-else lines="two" class="bg-transparent">
        <v-list-item
          v-for="initiative in filteredInitiatives"
          :key="initiative.id"
          class="mb-2"
          rounded="lg"
          :class="{ 'bg-primary-lighten-5': selectedId === initiative.id }"
        >
          <template #prepend>
            <v-icon color="primary" class="mr-2">mdi-lightbulb-outline</v-icon>
          </template>

          <v-list-item-title class="d-flex align-center">
            <span class="text-subtitle-2">{{ initiative.name }}</span>
            <v-spacer />
            <v-chip size="x-small" color="primary" variant="tonal">
              {{ getQuarterLabel(initiative.quarter) }}
            </v-chip>
          </v-list-item-title>

          <v-list-item-subtitle>
            <div class="d-flex align-center mt-1">
              <v-chip
                v-for="(req, idx) in initiative.roleRequirements.slice(0, 3)"
                :key="idx"
                size="x-small"
                :color="getRoleColor(req.role)"
                variant="tonal"
                class="mr-1"
              >
                {{ req.role }}: {{ req.effort }}w
              </v-chip>
              <v-chip
                v-if="initiative.roleRequirements.length > 3"
                size="x-small"
                color="grey"
                variant="tonal"
              >
                +{{ initiative.roleRequirements.length - 3 }}
              </v-chip>
            </div>
          </v-list-item-subtitle>

          <template #append>
            <div v-if="!readonly" class="d-flex align-center">
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                color="primary"
                @click.stop="$emit('edit', initiative.id)"
              />
              <v-btn
                icon="mdi-delete-outline"
                size="small"
                variant="text"
                color="error"
                @click.stop="$emit('delete', initiative.id)"
              />
            </div>
          </template>
        </v-list-item>
      </v-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Initiative } from '~/types'
import { useInitiativesStore } from '~/stores/initiatives'
import { useQuartersStore } from '~/stores/quarters'

interface Props {
  quarterFilter?: string | null
  displayMode?: 'grid' | 'list'
  readonly?: boolean
  selectedId?: string
}

interface Emits {
  'edit': [id: string]
  'delete': [id: string]
  'select': [initiative: Initiative]
}

const props = withDefaults(defineProps<Props>(), {
  displayMode: 'grid',
  readonly: false
})

const emit = defineEmits<Emits>()

const initiativesStore = useInitiativesStore()
const quartersStore = useQuartersStore()

const filteredInitiatives = computed(() => {
  let initiatives = initiativesStore.initiatives

  if (props.quarterFilter) {
    initiatives = initiativesStore.getInitiativesByQuarter(props.quarterFilter)
  }

  return initiatives
})

const quarterLabel = computed(() => {
  if (!props.quarterFilter) return ''
  const quarter = quartersStore.getQuarterById(props.quarterFilter)
  return quarter?.label || props.quarterFilter
})

function getQuarterLabel(quarterId: string): string {
  const quarter = quartersStore.getQuarterById(quarterId)
  return quarter?.label || quarterId
}

function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    BE: 'blue',
    FE: 'green',
    MOBILE: 'purple',
    QA: 'orange'
  }
  return colors[role] || 'grey'
}
</script>

<style scoped>
.initiative-list {
  min-height: 200px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}
</style>
