<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { TChipStatus } from '@talana/talanify-next'

defineProps({
  title:  { type: String, required: true },
  icon:   { type: String, required: true },
  carga:  { type: Array,  default: () => [] },
  valida: { type: Array,  default: () => [] },
})
</script>

<template>
  <!-- bg-Surface-Alternative #F6F6F6, outline Stroke-Neutral #CFD8DC -->
  <div style="flex:1;padding:1rem;background:#F6F6F6;border-radius:0.5rem;border:1px solid #CFD8DC;display:flex;align-items:center;gap:1rem;">

    <!-- Icono + título -->
    <div style="flex:1;display:flex;align-items:flex-start;gap:0.5rem;">
      <!-- Icon box: bg-Surface-BrandLight #DDD5FF, rounded-sm -->
      <div style="padding:0.5rem;background:#DDD5FF;border-radius:0.25rem;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
        <iconify-icon :icon="icon" style="font-size:24px;color:#0E0E19;" />
      </div>
      <div style="display:flex;flex-direction:column;justify-content:flex-start;">
        <span style="font-size:1.125rem;font-weight:700;color:#0E0E19;font-family:'Inter',sans-serif;line-height:1.75rem;">{{ title }}</span>
        <span style="font-size:0.875rem;font-weight:400;color:#0E0E19;font-family:'Inter',sans-serif;line-height:1.25rem;">Responsables</span>
      </div>
    </div>

    <!-- Separador vertical -->
    <div style="width:1px;align-self:stretch;background:#CFD8DC;flex-shrink:0;" />

    <!-- Carga -->
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:0.25rem;">
      <TChipStatus variant="primary" style="align-self:flex-start;">Carga</TChipStatus>
      <template v-if="carga.length">
        <div v-for="r in carga" :key="r.nombre" style="display:flex;flex-direction:column;">
          <span style="font-size:0.75rem;font-weight:400;color:#6B7280;font-family:'Inter',sans-serif;line-height:1rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ r.rol }}</span>
          <span style="font-size:0.875rem;font-weight:500;color:#0E0E19;font-family:'Inter',sans-serif;line-height:1.25rem;">{{ r.nombre }}</span>
        </div>
      </template>
      <span v-else style="font-size:0.75rem;color:#9ca3af;font-family:'Inter',sans-serif;">—</span>
    </div>

    <!-- Separador vertical -->
    <div style="width:1px;align-self:stretch;background:#CFD8DC;flex-shrink:0;" />

    <!-- Valida -->
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:0.25rem;">
      <TChipStatus variant="primary" style="align-self:flex-start;">Valida</TChipStatus>
      <template v-if="valida.length">
        <div v-for="r in valida" :key="r.nombre" style="display:flex;flex-direction:column;">
          <span style="font-size:0.75rem;font-weight:400;color:#6B7280;font-family:'Inter',sans-serif;line-height:1rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ r.rol }}</span>
          <span style="font-size:0.875rem;font-weight:500;color:#0E0E19;font-family:'Inter',sans-serif;line-height:1.25rem;">{{ r.nombre }}</span>
        </div>
      </template>
      <span v-else style="font-size:0.75rem;color:#9ca3af;font-family:'Inter',sans-serif;">—</span>
    </div>

  </div>
</template>
