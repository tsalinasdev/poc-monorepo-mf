<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { computed } from 'vue'
import { TCard, TButton, TSelectText, TUploadFile, TSectionMessage, TChipStatus } from '@talana/talanify-next'

// Shell compartido de layout para los 3 flujos de carga masiva (KPI, Asignación,
// Resultados) — la lógica de parseo/validación de CSV es específica de cada
// entidad y queda en el componente que usa este shell, no acá.
const props = defineProps({
  title:               { type: String, required: true },
  subtitle:            { type: String, required: true },
  instructions:        { type: Array,  required: true }, // bullets de "antes de subir tu archivo"
  ciclosOptions:       { type: Array,  default: () => [] },
  selectedCiclo:       { type: [String, Number], default: null },
  uploadedFile:        { type: Object, default: null },
  phase:               { type: String, default: 'idle' }, // idle | processing | done
  results:             { type: Object, default: null },   // { total, ok, errors: [{ fila, motivo }] }
  canDownloadTemplate: { type: Boolean, default: true },   // Resultados la deshabilita sin ciclo seleccionado
  requireCiclo:        { type: Boolean, default: false },  // Resultados también bloquea la subida sin ciclo (la plantilla depende de él)
})

const emit = defineEmits([
  'update:selectedCiclo',
  'update:uploadedFile',
  'download-template',
  'download-error-report',
  'cancel',
  'finish',
])

const canFinish = computed(() => props.phase === 'done')
</script>

<template>
  <TCard>
    <div class="flex justify-start items-start gap-4">

      <!-- Left: Instructions card -->
      <div class="w-96 flex-shrink-0">
        <TCard>
          <template #header>
            <span style="font-family: 'Inter', sans-serif; font-size: 0.875rem; font-weight: 700; line-height: 1.25rem; color: #0E0E19;">
              Antes de subir tu archivo
            </span>
          </template>

          <div class="flex justify-start items-start gap-1">
            <iconify-icon icon="mdi:information-slab-circle-outline" style="color: #27273F; font-size: 20px; flex-shrink: 0; margin-top: 2px;" />
            <div style="font-family: 'Inter', sans-serif; font-size: 0.875rem; font-weight: 400; line-height: 1.25rem; color: #27273F;">
              <p style="margin: 0 0 4px 0;">Recuerda verificar que el archivo cuente con:</p>
              <ul style="margin: 0; padding-left: 1.25rem; list-style-type: disc; display: flex; flex-direction: column; gap: 2px;">
                <li v-for="line in instructions" :key="line">{{ line }}</li>
              </ul>
            </div>
          </div>

          <template #actions>
            <div class="flex justify-end">
              <TButton
                variant="secondary" size="sm" icon-left="mdi:file-download-outline"
                :disabled="!canDownloadTemplate"
                @click="emit('download-template')"
              >
                Descargar plantilla
              </TButton>
            </div>
          </template>
        </TCard>
      </div>

      <!-- Right: Upload form -->
      <div class="flex-1 flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <div style="font-family: 'Inter', sans-serif; font-size: 1.125rem; font-weight: 700; line-height: 1.75rem; color: #0E0E19;">
            {{ title }}
          </div>
          <div style="font-family: 'Inter', sans-serif; font-size: 0.875rem; font-weight: 400; line-height: 1.25rem; color: #0E0E19;">
            {{ subtitle }}
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <TSelectText
            :model-value="selectedCiclo"
            label="Ciclo KPI"
            placeholder="Selecciona un ciclo"
            :items="ciclosOptions"
            item-text="label"
            item-value="value"
            @update:model-value="emit('update:selectedCiclo', $event)"
          />

          <TUploadFile
            :model-value="uploadedFile"
            accept=".csv,.xls,.xlsx"
            :max-size="104857600"
            :progress-bar="false"
            :disabled="phase === 'processing' || (requireCiclo && !selectedCiclo)"
            @update:model-value="emit('update:uploadedFile', $event)"
          />

          <TSectionMessage v-if="phase === 'processing'" :show="true" variant="info">
            Procesando archivo...
          </TSectionMessage>

          <template v-if="phase === 'done' && results">
            <TSectionMessage
              :show="true"
              :variant="results.errors.length === 0 && results.ok > 0 ? 'success' : results.ok > 0 ? 'warning' : 'danger'"
            >
              <template v-if="results.errors.length === 0 && results.ok > 0">
                Se cargaron {{ results.ok }} de {{ results.total }} registros exitosamente.
              </template>
              <template v-else-if="results.ok > 0">
                Se cargaron {{ results.ok }} de {{ results.total }} registros. {{ results.errors.length }} con errores.
              </template>
              <template v-else>
                No se logró cargar ninguna fila. Revisa el detalle de errores.
              </template>
            </TSectionMessage>

            <div v-if="results.errors.length" class="flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <span class="tln:text-sm tln:font-medium">Filas no cargadas ({{ results.errors.length }})</span>
                <TButton variant="secondary" size="sm" icon-left="mdi:file-download-outline" @click="emit('download-error-report')">
                  Descargar reporte de errores
                </TButton>
              </div>
              <div class="flex flex-col gap-1 max-h-40 overflow-y-auto">
                <div
                  v-for="err in results.errors"
                  :key="err.fila"
                  class="flex gap-2 items-center tln:text-sm"
                >
                  <TChipStatus variant="danger">Fila {{ err.fila }}</TChipStatus>
                  <span class="tln:text-black-500">{{ err.motivo }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

    </div>

    <template #actions>
      <div class="flex justify-between items-center">
        <TButton variant="tertiary" @click="emit('cancel')">Cancelar</TButton>
        <TButton variant="primary" :disabled="!canFinish" @click="emit('finish')">
          {{ results?.errors?.length ? 'Finalizar carga' : 'Finalizar y salir' }}
        </TButton>
      </div>
    </template>
  </TCard>
</template>
