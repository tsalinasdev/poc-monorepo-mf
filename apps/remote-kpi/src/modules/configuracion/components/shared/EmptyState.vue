<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { TEmptyState, TButton, TDropdown, TListItem } from '@talana/talanify-next'

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  buttonLabel: { type: String, required: true },
  items: { type: Array, default: null },
  showAddIcon: { type: Boolean, default: true },
})

const emit = defineEmits(['click'])
</script>

<template>
  <TEmptyState illustration="box" :title="title" :description="description">
    <TDropdown v-if="items" placement="bottom-start">
      <template #activator>
        <TButton icon-left="material-symbols:add">
          {{ buttonLabel }}
        </TButton>
      </template>
      <div class="w-36 bg-Surface-Main rounded-lg shadow-lg outline outline-1 outline-offset-[-1px] outline-Stroke-Neutral p-2 flex flex-col gap-1">
        <TListItem
          v-for="item in items"
          :key="item.label"
          @click="item.onClick"
        >
          {{ item.label }}
        </TListItem>
      </div>
    </TDropdown>

    <TButton
      v-else
      :icon-left="showAddIcon ? 'material-symbols:add' : undefined"
      @click="emit('click')"
    >
      {{ buttonLabel }}
    </TButton>
  </TEmptyState>
</template>

<style scoped>
:deep(.tln\:font-regular.tln\:text-black-600) {
  white-space: pre-line;
}
</style>
