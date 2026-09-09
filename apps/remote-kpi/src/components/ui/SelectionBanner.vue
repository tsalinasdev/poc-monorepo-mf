<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { TButton, TCheckbox, TButtonIcon } from '@talana/talanify-next'

defineProps({
  selectedCount: { type: Number, required: true },
  totalCount:    { type: Number, required: true },
  allSelected:   { type: Boolean, default: false },
})

defineEmits(['select-all', 'associate', 'disassociate', 'delete', 'close'])

const BANNER_BG   = '#27273f'
const TEXT_WHITE  = '#ffffff'
const SEP_BORDER  = 'rgba(255,255,255,0.2)'
const FONT        = "'Inter', sans-serif"
</script>

<template>
  <div
    class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 p-4 rounded-2xl shadow-xl inline-flex justify-start items-center gap-2 whitespace-nowrap"
    :style="{ backgroundColor: BANNER_BG }"
  >

    <!-- Counts -->
    <div class="pr-2 inline-flex flex-col justify-start items-start">
      <div class="inline-flex items-start gap-1">
        <span :style="{ color: TEXT_WHITE, fontSize: '0.875rem', fontWeight: 500, fontFamily: FONT, lineHeight: '1.25rem' }">{{ selectedCount }}</span>
        <span :style="{ color: TEXT_WHITE, fontSize: '0.875rem', fontWeight: 500, fontFamily: FONT, lineHeight: '1.25rem' }">filas seleccionadas</span>
      </div>
      <div class="inline-flex items-start gap-1">
        <span :style="{ color: TEXT_WHITE, fontSize: '0.75rem', fontWeight: 400, fontFamily: FONT, lineHeight: '1rem' }">{{ totalCount }}</span>
        <span :style="{ color: TEXT_WHITE, fontSize: '0.75rem', fontWeight: 400, fontFamily: FONT, lineHeight: '1rem' }">filas en total</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-start items-center gap-4">

      <!-- Select all -->
      <TCheckbox dark title="Seleccionar todas las filas" :model-value="allSelected" @update:model-value="$emit('select-all')" />

      <!-- Bulk buttons -->
      <div class="flex items-center gap-2">
        <slot name="actions">
          <TButton variant="primary" size="sm" style="outline: 1px solid rgba(255,255,255,0.25); outline-offset: -1px;" @click="$emit('associate')">Asociar</TButton>
          <TButton variant="primary" size="sm" style="outline: 1px solid rgba(255,255,255,0.25); outline-offset: -1px;" @click="$emit('disassociate')">Desasociar</TButton>
          <TButton
            variant="primary" size="sm" icon-left="material-symbols:delete-outline"
            style="outline: 1px solid rgba(255,255,255,0.25); outline-offset: -1px;"
            @click="$emit('delete')"
          >
            Eliminar
          </TButton>
        </slot>
      </div>
    </div>

    <!-- Close -->
    <div class="pl-2 flex items-center" :style="{ borderLeft: `1px solid ${SEP_BORDER}` }">
      <TButtonIcon variant="tertiary-dark" icon="material-symbols:close" aria-label="Cerrar" @click="$emit('close')" />
    </div>

  </div>
</template>

