<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { TAlert, TButton } from '@talana/talanify-next'

defineProps({
  title:           { type: String, required: true },
  description:     { type: String, default: '' },
  descriptionBold: { type: String, default: '' },
  items:           { type: Array,  default: () => [] },
  confirmLabel:    { type: String, default: 'Confirmar' },
  cancelLabel:     { type: String, default: 'Cancelar' },
  confirmVariant:  { type: String, default: 'primary' },
  cancelVariant:   { type: String, default: 'tertiary' },
})

const show = defineModel('show', { type: Boolean, default: false })
const emit = defineEmits(['confirm'])
</script>

<template>
  <TAlert
    v-model:show="show"
    :title="title"
    variant="warning"
    @close="show = false"
  >
    <template #description>
      <p>
        <span :style="{ fontWeight: descriptionBold ? '400' : '700' }">{{ description }}</span>&nbsp;<span v-if="descriptionBold" style="font-weight: 700;">{{ descriptionBold }}</span>
      </p>
      <ul v-if="items.length" class="mt-2 list-disc pl-5 space-y-1 text-sm">
        <li v-for="item in items" :key="item">{{ item }}</li>
      </ul>
    </template>

    <template #footer>
      <TButton :variant="cancelVariant" @click="show = false">{{ cancelLabel }}</TButton>
      <TButton :variant="confirmVariant" @click="emit('confirm')">{{ confirmLabel }}</TButton>
    </template>
  </TAlert>
</template>

<style>
[role="alertdialog"] {
  border: 1px solid #FAAD14 !important;
}
[role="alertdialog"] [class*="title"] {
  color: #1C1B1F !important;
  font-size: 1.125rem !important;
  font-weight: 700 !important;
  font-family: 'Inter', sans-serif !important;
  line-height: 1.75rem !important;
}
</style>
