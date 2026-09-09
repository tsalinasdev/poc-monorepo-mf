<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { TButton, TButtonIcon } from '@talana/talanify-next'

defineProps({
  personaNombre: { type: String, required: true },
  hasPrev:       { type: Boolean, default: false },
  hasNext:       { type: Boolean, default: false },
})

defineEmits(['back', 'prev', 'next'])
</script>

<template>
  <div style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0;">

    <div style="display:flex;align-items:center;gap:0.75rem;">
      <TButtonIcon
        icon="material-symbols:arrow-back"
        variant="tertiary"
        aria-label="Volver al listado"
        @click="$emit('back')"
      />
      <div>
        <p style="font-size:0.75rem;color:#6b7280;font-weight:500;font-family:'Inter',sans-serif;line-height:1rem;">
          Detalle de asignación
        </p>
        <h1 style="font-size:1.25rem;font-weight:700;color:#1C1B1F;font-family:'Inter',sans-serif;line-height:1.75rem;margin:0;">
          {{ personaNombre }}
        </h1>
      </div>
    </div>

    <div style="display:flex;gap:0.5rem;">
      <TButton
        variant="secondary"
        icon-left="material-symbols:arrow-back-ios"
        :disabled="!hasPrev"
        @click="$emit('prev')"
      >
        Persona anterior
      </TButton>
      <TButton
        variant="secondary"
        icon-right="material-symbols:arrow-forward-ios"
        :disabled="!hasNext"
        @click="$emit('next')"
      >
        Siguiente persona
      </TButton>
    </div>

  </div>
</template>
