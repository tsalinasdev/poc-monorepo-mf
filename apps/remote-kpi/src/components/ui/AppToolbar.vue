<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { TButton, TButtonIcon, TDropdown, TInput, TSelectText, TListItem } from '@talana/talanify-next'

const BUTTON_STYLES = {
  add: { variant: 'primary', size: 'lg', icon: 'material-symbols:add' },
  upload: { variant: 'secondary', size: 'lg', icon: 'material-symbols:upload' },
  download: { variant: 'secondary', size: 'lg', icon: 'material-symbols:download' },
  save: { variant: 'primary', size: 'lg', icon: null },
}

const props = defineProps({
  filters: { type: Array, default: () => [] },
  filterValues: { type: Object, default: () => ({}) },
  buttons: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:filterValues'])

function updateFilter(key, value) {
  emit('update:filterValues', { ...props.filterValues, [key]: value })
}
</script>

<template>
  <div class="w-full flex items-end justify-between gap-4">
    <div class="flex items-end gap-3">
      <template v-for="f in filters" :key="f.key">
        <div v-if="f.type === 'text'" class="w-56">
          <TInput
            :model-value="filterValues[f.key]"
            :label="f.label"
            :placeholder="f.placeholder"
            has-icon-search
            @update:model-value="updateFilter(f.key, $event)"
          />
        </div>
        <div v-else-if="f.type === 'select'" class="w-56">
          <TSelectText
            :model-value="filterValues[f.key]"
            :label="f.label"
            :placeholder="f.placeholder"
            :items="f.options"
            item-text="label"
            item-value="value"
            @update:model-value="updateFilter(f.key, $event)"
          />
        </div>
      </template>
    </div>
    <div class="flex items-center gap-2">
      <template v-for="btn in buttons" :key="btn.type">
        <TDropdown v-if="btn.items" placement="bottom-end" :use-teleport="true" teleport-to="body">
          <template #activator>
            <TButton
              :variant="BUTTON_STYLES[btn.type]?.variant"
              :size="BUTTON_STYLES[btn.type]?.size"
              :icon-left="BUTTON_STYLES[btn.type]?.icon"
            >
              {{ btn.label }}
            </TButton>
          </template>
          <div class="w-36 bg-Surface-Main rounded-lg shadow-lg outline outline-1 outline-offset-[-1px] outline-Stroke-Neutral p-2 flex flex-col gap-1">
            <TListItem
              v-for="item in btn.items"
              :key="item.label"
              @click="item.onClick()"
            >
              {{ item.label }}
            </TListItem>
          </div>
        </TDropdown>

        <TButtonIcon
          v-else-if="btn.iconOnly"
          variant="secondary"
          size="md"
          :icon="BUTTON_STYLES[btn.type]?.icon"
          :aria-label="btn.label || btn.type"
          :disabled="btn.disabled"
          @click="btn.onClick?.()"
        />

        <TButton
          v-else
          :variant="BUTTON_STYLES[btn.type]?.variant"
          :size="BUTTON_STYLES[btn.type]?.size"
          :icon-left="BUTTON_STYLES[btn.type]?.icon"
          :disabled="btn.disabled"
          @click="btn.onClick?.()"
        >
          {{ btn.label }}
        </TButton>
      </template>
    </div>
  </div>
</template>
