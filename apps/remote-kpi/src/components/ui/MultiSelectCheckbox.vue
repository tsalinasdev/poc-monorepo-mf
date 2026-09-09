<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { computed, useId } from 'vue'
import { TSelectChips, TLabel } from '@talana/talanify-next'

// Wrapper sobre TSelectChips que preserva la firma anterior (modelValue como
// array de valores planos, no de objetos) para no tocar los ~5 field configs
// de FormDrawer que ya usan `type: 'multiselect'` con ese contrato.
//
// TSelectChips no tiene prop `label` (ver TSelectChipsProps) — replicamos acá
// el mismo wrapper `tln:grid tln:gap-1` + `TLabel` que usa TSelectText para
// que el label y el espaciado sean idénticos al resto de los selects.
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  items:      { type: Array, default: () => [] },
  itemText:   { type: String, default: 'label' },
  itemValue:  { type: String, default: 'value' },
  label:      { type: String, default: undefined },
  placeholder:{ type: String, default: 'Selecciona...' },
  hint:       { type: String, default: undefined },
  hasError:   { type: Boolean, default: false },
  disabled:   { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const inputId = useId()

const selectedItems = computed({
  get: () => props.items.filter((item) => (props.modelValue ?? []).includes(item[props.itemValue])),
  set: (items) => emit('update:modelValue', items.map((item) => item[props.itemValue])),
})
</script>

<template>
  <div class="tln:grid tln:w-full tln:gap-1">
    <TLabel v-if="label" :for="inputId" :error="hasError" :disabled="disabled">
      {{ label }}
    </TLabel>
    <TSelectChips
      :id="inputId"
      v-model="selectedItems"
      format="text"
      :items="items"
      :item-text="itemText"
      :item-value="itemValue"
      :placeholder="placeholder"
      :hint="hint"
      :has-error="hasError"
      :disabled="disabled"
      has-clear
    />
  </div>
</template>
