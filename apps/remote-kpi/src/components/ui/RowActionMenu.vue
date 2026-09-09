<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { TDropdown, TButtonIcon, TListItem } from '@talana/talanify-next'

defineProps({
  actions: { type: Array, required: true }, // [{ label: string, onClick: (row) => void, variant?: 'primary' | 'danger' }]
  row:     { type: Object, required: true },
})
</script>

<template>
  <TDropdown placement="bottom-end" :use-teleport="true" teleport-to="body">
    <template #activator>
      <TButtonIcon
        icon="material-symbols:more-vert"
        variant="tertiary"
        size="sm"
        aria-label="Opciones"
      />
    </template>

    <div class="w-max bg-Surface-Main rounded-lg shadow-lg outline outline-1 outline-offset-[-1px] outline-Stroke-Neutral p-2 flex flex-col gap-1">
      <TListItem
        v-for="action in actions"
        :key="action.label"
        :variant="action.variant ?? 'primary'"
        @click="action.onClick(row)"
      >
        {{ action.label }}
      </TListItem>
    </div>
  </TDropdown>
</template>
