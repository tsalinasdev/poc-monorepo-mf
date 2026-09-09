<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { TChipFilter } from '@talana/talanify-next'
import FormDrawer         from '@/components/ui/FormDrawer.vue'
import DataTable          from '@/components/ui/DataTable.vue'
import AppToolbar         from '@/components/ui/AppToolbar.vue'
import EmptyState         from '../components/shared/EmptyState.vue'
import ConfirmModal      from '@/components/ui/ConfirmModal.vue'
import SelectionBanner   from '@/components/ui/SelectionBanner.vue'
import AssociateDrawer   from '../components/kpis/AssociateDrawer.vue'
import KpiMasivoUpload  from '../components/kpis/KpiMasivoUpload.vue'
import { kpiToFormValues } from '../services/kpisService'
import { useKpis }         from '../composables/useKpis'
import { useCiclos }       from '../composables/useCiclos'
import { useKpiDrawer }    from '../composables/useKpiDrawer'
import { useLastCicloKpi } from '../composables/useLastCicloKpi'
import { useToast }        from '@/composables/useToast'
import { useListView }     from '@/composables/useListView'
import { downloadCsv }     from '@/utils/exportCsv'

const {
  kpis,
  filteredKpis,
  search,
  isEmpty,
  fetchKpis,
  deleteKpi,
  disassociateKpi,
  bulkDeleteKpis,
  bulkDisassociateKpis,
  bulkAssociateKpis,
  saveKpi,
} = useKpis()

const { ciclos, fetchCiclos } = useCiclos()
const { lastCicloKpi, setLastCicloKpi } = useLastCicloKpi()
const router = useRouter()

const ciclosOptions = computed(() =>
  ciclos.value.map(c => ({ label: c.nombre, value: c.nombre }))
)

const hasCiclos = computed(() => ciclos.value.length > 0)

const kpisOptions = computed(() =>
  kpis.value.map(k => ({ label: k.nombreKpi, value: k.id }))
)

const tableColumns = [
  { key: 'id',           name: 'ID KPI',          align: 'left' },
  { key: 'nombreKpi',    name: 'Nombre',           align: 'left' },
  { key: 'cicloKpi',     name: 'Ciclo KPI',        align: 'left' },
  { key: 'tipoCalculo',  name: 'Tipo de cálculo',  align: 'left' },
  { key: 'unidadMedida', name: 'Unidad de medida', align: 'left' },
  { key: 'dependencia',  name: 'Dependencia',      align: 'left' },
  { key: 'estado',       name: 'Estado',           align: 'left',
    statusVariants: { activo: 'success', inactivo: 'secondary' } },
]

const showDrawer            = ref(false)
const serviceError          = ref(null)
const showDeleteModal       = ref(false)
const showDisassociateModal = ref(false)
const showBulkDeleteModal        = ref(false)
const showBulkDisassociateModal  = ref(false)
const showAssociateDrawer        = ref(false)
const showMasivoUpload           = ref(false)
const kpiToDelete           = ref(null)
const kpiToDisassociate     = ref(null)
const kpiToEdit             = ref(null)
const selectedKpis          = ref([])
const dataTableRef          = ref(null)

const { drawerConfig, mode: drawerMode, setMode, initVariables } = useKpiDrawer({ ciclosOptions, kpisOptions, kpis, kpiToEdit })

const drawerInitialValues = computed(() => {
  if (!kpiToEdit.value) return { cicloKpi: cicloFilter.value ?? lastCicloKpi.value ?? null }
  const vals = kpiToFormValues(kpiToEdit.value)
  if (kpiToEdit.value.dependencia === 'padre') {
    vals.kpiHijos = kpis.value.filter(k => k.kpiPadre === kpiToEdit.value.id).map(k => k.id)
  }
  return vals
})

watch(showDrawer, (isOpen) => {
  if (!isOpen) {
    kpiToEdit.value = null
    setMode('create')
    initVariables(2)
  }
})

const { showToast } = useToast()

useListView({ search, addLabel: '', onAdd: () => {}, onEdit: () => {}, onDelete: () => {} })

const rowActions = [
  {
    label: 'Editar',
    onClick: (row) => {
      kpiToEdit.value = row
      setMode('edit')
      initVariables(row.variablesCount ?? 2)
      showDrawer.value = true
    },
  },
  {
    label: 'Desasociar',
    onClick: (row) => {
      kpiToDisassociate.value = row
      showDisassociateModal.value = true
    },
  },
  {
    label: 'Eliminar',
    onClick: (row) => {
      kpiToDelete.value = row
      showDeleteModal.value = true
    },
  },
]

function requireCiclo() {
  if (hasCiclos.value) return true
  showToast('Debes crear un ciclo antes de continuar', 'warning')
  return false
}

function openCreateDrawer() {
  if (!requireCiclo()) return
  kpiToEdit.value = null
  setMode('create')
  showDrawer.value = true
}

function openMasivoUpload() {
  if (requireCiclo()) showMasivoUpload.value = true
}

async function handleMasivoSubmit({ results }) {
  showMasivoUpload.value = false
  await fetchKpis()
  showToast(`Carga masiva: ${results?.ok ?? 0} registro(s) guardado(s)`)
}

function handleDownload() {
  const ciclo = cicloFilter.value ? `_${cicloFilter.value}` : ''
  downloadCsv(`kpis${ciclo}.csv`, tableColumns, kpisFiltered.value)
}

const toolbarButtons = [
  { type: 'download', label: 'Descargar', onClick: handleDownload },
  {
    type: 'add',
    label: 'Agregar KPI',
    items: [
      { label: 'Unitario', onClick: openCreateDrawer },
      { label: 'Masivo',   onClick: openMasivoUpload },
    ],
  },
]

const cicloFilter       = ref(null)
const dependenciaFilter = ref('todos')

const filterConfig = computed(() => [
  {
    type: 'select',
    key: 'cicloKpi',
    label: 'Ciclo KPI',
    placeholder: 'Todos los ciclos',
    options: [
      { label: 'Todos los ciclos', value: null },
      ...ciclosOptions.value,
    ],
  },
  {
    type: 'text',
    key: 'search',
    label: 'Buscar por nombre',
    placeholder: 'Buscar',
  },
])

const filterValues = computed({
  get: () => ({ search: search.value, cicloKpi: cicloFilter.value }),
  set: (v) => {
    search.value      = v.search   ?? ''
    cicloFilter.value = v.cicloKpi ?? null
  },
})

const filteredByCiclo = computed(() => {
  if (!cicloFilter.value) return filteredKpis.value
  return filteredKpis.value.filter(k => k.cicloKpi === cicloFilter.value)
})

const kpisFiltered = computed(() => {
  if (dependenciaFilter.value === 'todos') return filteredByCiclo.value
  return filteredByCiclo.value.filter(k => k.dependencia === dependenciaFilter.value)
})

const chipCounts = computed(() => ({
  todos:    filteredByCiclo.value.length,
  padre:    filteredByCiclo.value.filter(k => k.dependencia === 'padre').length,
  estandar: filteredByCiclo.value.filter(k => k.dependencia === 'estandar').length,
}))

const CHIPS = [
  { value: 'todos',    label: 'Todos' },
  { value: 'padre',    label: 'Padre' },
  { value: 'estandar', label: 'Estándar' },
]


async function handleSubmit(payload) {
  const isCreate = drawerMode.value === 'create'

  try {
    const mensaje = await saveKpi(payload, isCreate ? null : kpiToEdit.value)

    showDrawer.value = false
    if (isCreate) {
      await nextTick()
      setLastCicloKpi(payload.cicloKpi)
    }
    showToast(mensaje)
  } catch {
    serviceError.value = 'Por favor, inténtalo en unos minutos'
  }
}

async function handleDelete() {
  const mensaje = await deleteKpi(kpiToDelete.value.id)
  showDeleteModal.value = false
  kpiToDelete.value = null
  showToast(mensaje)
}

async function handleDisassociate() {
  await disassociateKpi(kpiToDisassociate.value.id)
  showDisassociateModal.value = false
  kpiToDisassociate.value = null
  showToast('KPI desasociados exitosamente')
}

const standardKpisFromSelection = computed(() =>
  kpis.value.filter(k => selectedKpis.value.includes(String(k.id)) && k.dependencia === 'estandar')
)

const padreOptions = computed(() =>
  kpis.value
    .filter(k => k.dependencia === 'padre')
    .map(k => ({ label: k.nombreKpi, value: k.id }))
)

async function handleBulkAssociate(padreId) {
  const ids = standardKpisFromSelection.value.map(k => k.id)
  await bulkAssociateKpis(ids, padreId)
  showAssociateDrawer.value = false
  dataTableRef.value?.clearSelection()
  showToast('KPI asociados con éxito')
}

async function handleBulkDisassociate() {
  await bulkDisassociateKpis(selectedKpis.value)
  showBulkDisassociateModal.value = false
  dataTableRef.value?.clearSelection()
  showToast('KPI desasociados con éxito')
}

async function handleBulkDelete() {
  await bulkDeleteKpis(selectedKpis.value)
  showBulkDeleteModal.value = false
  dataTableRef.value?.clearSelection()
  showToast('KPIs eliminados exitosamente')
}

onMounted(async () => {
  await Promise.all([fetchKpis(), fetchCiclos()])
  if (cicloFilter.value === null) cicloFilter.value = ciclos.value.at(-1)?.nombre ?? null
})
</script>

<template>
  <AppToolbar
    v-if="!isEmpty && !showMasivoUpload"
    v-model:filter-values="filterValues"
    :filters="filterConfig"
    :buttons="toolbarButtons"
  />

  <div v-if="!isEmpty && !showMasivoUpload" class="flex gap-2 mt-3">
    <TChipFilter
      v-for="chip in CHIPS"
      :key="chip.value"
      :label="chip.label"
      :is-active="dependenciaFilter === chip.value"
      :count-filter="chipCounts[chip.value]"
      @click="dependenciaFilter = chip.value"
    />
  </div>

  <EmptyState
    v-if="!hasCiclos"
    title="Aún no tienes ciclos creados"
    description="Crea un ciclo KPI antes de poder agregar KPIs."
    button-label="Ir a Ciclos"
    :show-add-icon="false"
    @click="router.push({ name: 'ciclos' })"
  />

  <EmptyState
    v-else-if="isEmpty && !showMasivoUpload"
    title="Aún no tienes KPIs creados"
    description="Puedes crear KPIs unitario o masivamente mediante una plantilla."
    button-label="Agregar KPI"
    :items="[
      { label: 'Unitario', onClick: openCreateDrawer },
      { label: 'Masivo',   onClick: openMasivoUpload },
    ]"
  />

  <KpiMasivoUpload
    v-if="showMasivoUpload"
    :ciclos-options="ciclosOptions"
    :kpis="kpis"
    @cancel="showMasivoUpload = false"
    @submit="handleMasivoSubmit"
  />

  <DataTable
    v-else-if="!isEmpty"
    ref="dataTableRef"
    v-model:selected="selectedKpis"
    selectable
    :data-head="tableColumns"
    :data-body="kpisFiltered"
    :row-actions="rowActions"
    action-type="menu"
    @clear-search="search = ''"
  />

  <Transition name="banner">
  <SelectionBanner
    v-if="selectedKpis.length"
    :selected-count="selectedKpis.length"
    :total-count="kpisFiltered.length"
    :all-selected="selectedKpis.length > 0 && selectedKpis.length === kpisFiltered.length"
    @select-all="dataTableRef?.selectAll()"
    @associate="showAssociateDrawer = true"
    @disassociate="showBulkDisassociateModal = true"
    @delete="showBulkDeleteModal = true"
    @close="dataTableRef?.clearSelection()"
  />
  </Transition>

  <FormDrawer
    v-model:show="showDrawer"
    v-model:service-error="serviceError"
    :config="drawerConfig"
    :initial-values="drawerInitialValues"
    :require-dirty="drawerMode === 'edit'"
    @submit="handleSubmit"
  />

  <ConfirmModal
    v-model:show="showDeleteModal"
    title="¿Realmente quieres eliminar este KPI?"
    description="Esta acción es irreversible"
    confirm-label="Eliminar"
    @confirm="handleDelete"
  />

  <ConfirmModal
    v-model:show="showBulkDisassociateModal"
    :title="`¿Realmente quieres desasociar ${selectedKpis.length} KPIs?`"
    description="Esta operación desasociará las dependencias de todos los KPIs seleccionados."
    description-bold="Esta acción es irreversible"
    confirm-label="Desasociar"
    cancel-variant="tertiary"
    @confirm="handleBulkDisassociate"
  />

  <ConfirmModal
    v-model:show="showBulkDeleteModal"
    :title="`¿Realmente quieres eliminar ${selectedKpis.length} KPIs?`"
    description="Esta acción es irreversible"
    confirm-label="Eliminar"
    @confirm="handleBulkDelete"
  />

  <AssociateDrawer
    v-model:show="showAssociateDrawer"
    :standard-count="standardKpisFromSelection.length"
    :padre-options="padreOptions"
    @confirm="handleBulkAssociate"
  />

  <ConfirmModal
    v-model:show="showDisassociateModal"
    title="¿Realmente quieres desasociar este KPI?"
    description="Esta operación eliminará todas las asociaciones de dependencia de este KPI."
    description-bold="Esta acción es irreversible"
    confirm-label="Desasociar"
    cancel-variant="tertiary"
    @confirm="handleDisassociate"
  />
</template>

<style scoped>
.banner-enter-active,
.banner-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
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
