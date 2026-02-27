<template>
  <v-navigation-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    app
    width="260"
  >
    <v-list nav density="comfortable">
      <v-list-item
        prepend-icon="mdi-view-dashboard"
        title="Dashboard"
        to="/"
        exact
        color="primary"
      />

      <v-list-item
        prepend-icon="mdi-account-group"
        title="Team Members"
        to="/members"
        color="primary"
      />

      <v-list-item
        prepend-icon="mdi-lightbulb-outline"
        title="Initiatives"
        to="/initiatives"
        color="primary"
      />

      <v-list-item
        prepend-icon="mdi-view-column"
        title="Capacity Board"
        to="/board"
        color="primary"
      />
    </v-list>

    <template #append>
      <div class="pa-4">
        <v-btn
          block
          variant="outlined"
          color="primary"
          size="small"
          prepend-icon="mdi-cog"
          to="/settings"
        >
          Settings
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>
