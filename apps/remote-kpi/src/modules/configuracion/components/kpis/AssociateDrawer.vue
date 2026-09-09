<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { ref, watch } from 'vue'
import { TDrawer, TButton, TSelectText, TSectionMessage } from '@talana/talanify-next'

defineProps({
  standardCount: { type: Number, default: 0 },
  padreOptions:  { type: Array,  default: () => [] },
})

const emit = defineEmits(['confirm'])
const show  = defineModel('show', { type: Boolean, default: false })
const selectedPadreId = ref(null)

watch(show, (v) => { if (!v) selectedPadreId.value = null })

function handleConfirm() {
  emit('confirm', selectedPadreId.value)
}
</script>

<template>
  <TDrawer v-model:show="show" :has-backdrop="true" :has-footer="true" @close="show = false">
    <template #header>
      <span class="tln:text-body-lg tln:font-bold">Asociar KPIs</span>
    </template>

    <div class="flex flex-col gap-4">
      <TSectionMessage :show="true" variant="warning" icon="material-symbols:warning-outline">
        Los KPIs de tipo padre serán <strong>descartados de la selección</strong> para esta asociación.
      </TSectionMessage>

      <TSectionMessage :show="true" variant="info" icon="mdi:information-slab-circle-outline">
        Se seleccionaron <strong>{{ standardCount }}</strong> KPI estándar
      </TSectionMessage>

      <!-- KPI Padre selector -->
      <TSelectText
        v-model="selectedPadreId"
        label="KPI Padre"
        placeholder="Selecciona un KPI para asociar como padre"
        :items="padreOptions"
        item-text="label"
        item-value="value"
      />
    </div>

    <template #footer>
      <div class="flex justify-end items-center gap-4">
        <TButton variant="tertiary" @click="show = false">Cancelar</TButton>
        <TButton variant="primary" :disabled="!selectedPadreId" @click="handleConfirm">Asociar</TButton>
      </div>
    </template>
  </TDrawer>
</template>
