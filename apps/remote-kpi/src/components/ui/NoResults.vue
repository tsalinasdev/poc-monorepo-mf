<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { TEmptyState, TButton } from '@talana/talanify-next'

const emit = defineEmits(['clear'])
</script>

<template>
  <TEmptyState
    illustration="box-not-found"
    :has-background="false"
    title="No hay resultados"
    description="No hay resultados que coincidan con los criterios de búsqueda."
  >
    <TButton variant="secondary" icon-left="material-symbols:close" @click="emit('clear')">
      Limpiar búsqueda
    </TButton>
  </TEmptyState>
</template>
