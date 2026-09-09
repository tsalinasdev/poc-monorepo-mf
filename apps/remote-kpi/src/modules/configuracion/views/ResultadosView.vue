<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { TButton, TChipStatus, TInput } from '@talana/talanify-next'
import AppToolbar from '@/components/ui/AppToolbar.vue'
import DataTable from '@/components/ui/DataTable.vue'
import SelectionBanner from '@/components/ui/SelectionBanner.vue'
import EmptyState from '../components/shared/EmptyState.vue'
import ResultadosStatCard from '../components/resultados/ResultadosStatCard.vue'
import ResultadosMasivoUpload from '../components/resultados/ResultadosMasivoUpload.vue'
import { useResultados } from '../composables/useResultados'
import { useCiclos } from '../composables/useCiclos'
import { useToast } from '@/composables/useToast'
import { downloadCsv } from '@/utils/exportCsv'

const STATUS_META = [
  { key: 'validado',    label: 'Validado',    chipVariant: 'success'   },
  { key: 'por_validar', label: 'Por validar', chipVariant: 'warning'   },
  { key: 'por_cargar',  label: 'Por cargar',  chipVariant: 'info'      },
  { key: 'por_definir', label: 'Por definir', chipVariant: 'secondary' },
]

const ESTADO_VARIANT = Object.fromEntries(STATUS_META.map(c => [c.key, c.chipVariant]))
const ESTADO_LABEL   = Object.fromEntries(STATUS_META.map(c => [c.key, c.label]))

const router = useRouter()
const { showToast } = useToast()

const {
  tableRows,
  stats,
  search,
  selectedCicloId,
  isEmpty,
  isDirty,
  fetchResultados,
  setResultado,
  saveAll,
  resetRow,
  validateRow,
  bulkValidateRows,
} = useResultados()

const { ciclos, fetchCiclos } = useCiclos()

onMounted(async () => {
  await fetchCiclos()
  if (selectedCicloId.value === null) selectedCicloId.value = ciclos.value.at(-1)?.id ?? null
  await fetchResultados()
})

const estadoCards = computed(() => STATUS_META.map(c => ({ ...c, count: stats.value[c.key] ?? 0 })))

const cicloOptions = computed(() => ciclos.value.map(c => ({ label: c.nombre, value: c.id })))

const cicloFilterConfig = computed(() => [
  { type: 'select', key: 'cicloId', label: 'Ciclo KPI', placeholder: 'Seleccionar ciclo', options: cicloOptions.value },
])

const cicloFilterValues = computed({
  get: () => ({ cicloId: selectedCicloId.value }),
  set: (v) => { selectedCicloId.value = v.cicloId ?? selectedCicloId.value },
})

const searchFilterConfig = [
  { type: 'text', key: 'search', label: 'Buscar por nombre', placeholder: 'Buscar' },
]

const searchFilterValues = computed({
  get: () => ({ search: search.value }),
  set: (v) => { search.value = v.search ?? '' },
})

function handleDownload() {
  const ciclo = selectedCicloId.value ? `_${selectedCicloId.value}` : ''
  downloadCsv(`resultados${ciclo}.csv`, tableColumns, tableRows.value)
}

const showMasivoUpload = ref(false)

async function handleMasivoSubmit({ results }) {
  showMasivoUpload.value = false
  await fetchResultados()
  showToast(`Carga masiva: ${results?.ok ?? 0} registro(s) guardado(s)`)
}

const toolbarButtons = computed(() => [
  { type: 'download', label: 'Descargar', iconOnly: true, onClick: handleDownload },
  { type: 'upload', label: 'Cargar masivo', onClick: () => { showMasivoUpload.value = true } },
  { type: 'save', label: 'Guardar', disabled: !isDirty.value, onClick: handleSave },
])

const tableColumns = [
  { key: 'persona',      name: 'Persona',             align: 'left'  },
  { key: 'kpiNombre',    name: 'KPI',                 align: 'left'  },
  { key: 'descripcion',  name: 'Descripción',         align: 'left'  },
  { key: 'tipoCalculo',  name: 'Tipo de cálculo',     align: 'left'  },
  { key: 'periodoLabel', name: 'Periodo de medición', align: 'left'  },
  { key: 'meta',         name: 'Meta',                 align: 'right' },
  { key: 'resultado',    name: 'Resultado',            align: 'right' },
  { key: 'estado',       name: 'Estado',                align: 'left', format: (row) => ESTADO_LABEL[row.estado] ?? row.estado },
  { key: 'cumplimiento', name: 'Cumplimiento',          align: 'right' },
]

const selectedRows = ref([])
const dataTableRef = ref(null)

async function handleSave() {
  const mensaje = await saveAll()
  showToast(mensaje)
}

async function handleReset(row) {
  const mensaje = await resetRow(row)
  showToast(mensaje)
}

async function handleValidate(row) {
  const mensaje = await validateRow(row)
  showToast(mensaje)
}

async function handleBulkValidate() {
  const mensaje = await bulkValidateRows(selectedRows.value)
  selectedRows.value = []
  dataTableRef.value?.clearSelection()
  showToast(mensaje)
}

function handleCloseSelection() {
  selectedRows.value = []
  dataTableRef.value?.clearSelection()
}
</script>

<template>
  <AppToolbar v-if="!isEmpty && !showMasivoUpload" v-model:filter-values="cicloFilterValues" :filters="cicloFilterConfig" />

  <div v-if="!isEmpty && !showMasivoUpload" class="self-stretch flex justify-start items-start gap-4 my-4">
    <ResultadosStatCard :value="`${stats.porcentaje}%`" label="KPI con resultados">
      <div class="self-stretch flex justify-start items-center gap-2">
        <div class="text-Text-Dark-Primary text-base font-bold font-['Inter'] leading-6">
          {{ stats.conResultado }} de {{ stats.total }}
        </div>
      </div>
    </ResultadosStatCard>
    <ResultadosStatCard
      v-for="card in estadoCards"
      :key="card.key"
      :value="String(card.count)"
      label="KPI con estado"
    >
      <TChipStatus :variant="card.chipVariant">{{ card.label }}</TChipStatus>
    </ResultadosStatCard>
  </div>

  <AppToolbar
    v-if="!isEmpty && !showMasivoUpload"
    v-model:filter-values="searchFilterValues"
    :filters="searchFilterConfig"
    :buttons="toolbarButtons"
  />

  <EmptyState
    v-if="isEmpty && !showMasivoUpload"
    title="Aquí verás los KPI para ingresar sus resultados"
    description="Es necesario que las ponderaciones cumplan con el 100% y las metas
estén validadas por el líder o administrador según corresponda en el menú de Asignación."
    button-label="Ir a Asignación"
    :show-add-icon="false"
    @click="router.push({ name: 'asignacion' })"
  />

  <ResultadosMasivoUpload
    v-if="showMasivoUpload"
    :ciclos-options="cicloOptions"
    @cancel="showMasivoUpload = false"
    @submit="handleMasivoSubmit"
  />

  <DataTable
    v-else-if="!isEmpty"
    ref="dataTableRef"
    v-model:selected="selectedRows"
    :data-head="tableColumns"
    :data-body="tableRows"
    action-type="reset-validate"
    :selectable="true"
    truncate-headers
    @clear-search="search = ''"
    @reset="handleReset"
    @validate="handleValidate"
  >
    <template #meta="{ row }">
      <div class="tln:w-full tln:text-right">{{ row.meta ? `${row.meta}%` : '—' }}</div>
    </template>

    <template #resultado="{ row }">
      <TInput
        type="number"
        :model-value="row.resultado ?? ''"
        icon="material-symbols:percent"
        placeholder="—"
        @update:model-value="setResultado(row.id, $event)"
      />
    </template>

    <template #estado="{ row }">
      <TChipStatus :variant="ESTADO_VARIANT[row.estado]">{{ ESTADO_LABEL[row.estado] }}</TChipStatus>
    </template>

    <template #cumplimiento="{ row }">
      <div class="tln:w-full tln:text-right">{{ row.cumplimiento }}%</div>
    </template>
  </DataTable>

  <Transition name="banner">
    <SelectionBanner
      v-if="selectedRows.length && !showMasivoUpload"
      :selected-count="selectedRows.length"
      :total-count="tableRows.length"
      :all-selected="selectedRows.length >= tableRows.length"
      @select-all="selectedRows = [...tableRows]"
      @close="handleCloseSelection"
    >
      <template #actions>
        <TButton variant="primary" size="sm" icon-left="material-symbols:check-circle-outline" @click="handleBulkValidate">
          Validar
        </TButton>
      </template>
    </SelectionBanner>
  </Transition>
</template>

<style scoped>
.banner-enter-active,
.banner-leave-active {
  transition: all 0.2s ease;
}
.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
.banner-enter-to,
.banner-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
