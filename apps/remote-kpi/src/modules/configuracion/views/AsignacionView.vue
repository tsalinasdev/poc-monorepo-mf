<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { TChipStatus, TButton } from '@talana/talanify-next'
import AppToolbar from '@/components/ui/AppToolbar.vue'
import DataTable from '@/components/ui/DataTable.vue'
import EmptyState from '../components/shared/EmptyState.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import FormDrawer from '@/components/ui/FormDrawer.vue'
import AsignacionMasivoUpload from '../components/asignacion/AsignacionMasivoUpload.vue'
import SelectionBanner from '@/components/ui/SelectionBanner.vue'
import { useAsignaciones } from '../composables/useAsignaciones'
import { useAsignacionDrawer } from '../composables/useAsignacionDrawer'
import { useEditarResponsablesDrawer } from '../composables/useEditarResponsablesDrawer'
import { useCiclos } from '../composables/useCiclos'
import { useKpis } from '../composables/useKpis'
import { useToast } from '@/composables/useToast'
import { AREAS_SEED, CARGOS_SEED, USUARIOS_SEED } from '@api/configuracion/usuarios/get_usuarios.php.ts'

const {
  asignaciones,
  tableRows,
  search,
  selectedCicloId,
  isEmpty,
  fetchAsignaciones,
  createAsignacion,
  getResponsablesInitialValues,
  updateResponsables,
  bulkUpdateResponsables,
  deleteAsignacion,
  bulkDeleteAsignaciones,
} = useAsignaciones()

const { ciclos, fetchCiclos } = useCiclos()
const { kpis, fetchKpis }     = useKpis()

const areaOptions    = computed(() => AREAS_SEED.map(a => ({ label: a.nombre, value: a.id })))
const cargoOptions   = computed(() => CARGOS_SEED.map(c => ({ label: c.nombre, value: c.id })))
const personaOptions = computed(() => USUARIOS_SEED.map(u => ({ label: `${u.nombre} ${u.apellido}`, value: u.id })))
const kpiOptions     = computed(() => kpis.value.map(k => ({ label: k.nombreKpi, value: k.id })))
const tipoCicloDrawer = computed(() => selectedCiclo.value?.tipoCiclo ?? null)

const { drawerConfig, setMode } = useAsignacionDrawer({ areaOptions, cargoOptions, personaOptions, kpiOptions, tipoCiclo: tipoCicloDrawer })

// rows a editar en modo masivo — [{ asignacionId, userId }]. Vacío en edición
// individual (no muestra el chip "N registros seleccionados").
const bulkEditRows = ref([])
const bulkEditCount = computed(() => bulkEditRows.value.length)
const { drawerConfig: drawerConfigResponsables } = useEditarResponsablesDrawer({ selectedCount: bulkEditCount })

onMounted(async () => {
  await Promise.all([fetchCiclos(), fetchKpis()])
  if (selectedCicloId.value === null) selectedCicloId.value = ciclos.value.at(-1)?.id ?? null
  await fetchAsignaciones()
})

const cicloOptions = computed(() =>
  ciclos.value.map((c) => ({ label: c.nombre, value: c.id })),
)

const hasCiclos = computed(() => ciclos.value.length > 0)
const hasKpis   = computed(() => kpis.value.length > 0)

const filterConfig = computed(() => {
  const filters = [
    {
      type: 'select',
      key: 'cicloId',
      label: 'Ciclo KPI',
      placeholder: 'Seleccionar ciclo',
      options: cicloOptions.value,
    },
  ]
  if (!isEmpty.value) {
    filters.push({ type: 'text', key: 'search', label: 'Buscar por persona', placeholder: 'Buscar' })
  }
  return filters
})

const filterValues = computed({
  get: () => ({ cicloId: selectedCicloId.value, search: search.value }),
  set: (v) => {
    selectedCicloId.value = v.cicloId ?? selectedCicloId.value
    search.value = v.search ?? ''
  },
})

const showAsignarDrawer          = ref(false)
const showEditarResponsables     = ref(false)
const serviceError               = ref(null)
const serviceErrorResponsables   = ref(null)
const asignacionIdToEditRespons  = ref(null)
const userIdToEditRespons        = ref(null)
const showMasivoUpload           = ref(false)
const router                     = useRouter()
const selectedAsignaciones       = ref([])
const dataTableRef               = ref(null)

// "Todas" es relativo a la página actual (lo que la tabla muestra), no al
// total de registros traídos de la API — coincide con lo que el usuario ve.
const pageIds = computed(() => dataTableRef.value?.getPageIds?.() ?? [])

// Derivado del estado real de selección (no un flag aparte), para que el
// banner refleje "todas seleccionadas" sin importar qué componente originó
// la selección (checkbox de header, fila por fila, o el propio banner).
const allRowsSelected = computed(() =>
  pageIds.value.length > 0 && selectedAsignaciones.value.length === pageIds.value.length
)

function handleSelectAll() {
  if (allRowsSelected.value) {
    selectedAsignaciones.value = []
    dataTableRef.value?.clearSelection()
  } else {
    selectedAsignaciones.value = pageIds.value
    dataTableRef.value?.selectByIds(pageIds.value)
  }
}

function handleCloseSelection() {
  selectedAsignaciones.value = []
  dataTableRef.value?.clearSelection()
}

const drawerInitialValues = computed(() => ({}))

const editarResponsablesInitialValues = computed(() =>
  asignacionIdToEditRespons.value
    ? getResponsablesInitialValues(asignacionIdToEditRespons.value, userIdToEditRespons.value)
    : {}
)

watch(showEditarResponsables, (isOpen) => {
  if (!isOpen) {
    asignacionIdToEditRespons.value = null
    userIdToEditRespons.value = null
    bulkEditRows.value = []
  }
})

function openBulkEditarResponsables() {
  bulkEditRows.value = bulkSource.value.map(r => ({ asignacionId: r.asignacionId, userId: r.userId }))
  showEditarResponsables.value = true
}

async function handleEditarResponsablesSubmit(payload) {
  try {
    if (bulkEditRows.value.length) {
      await bulkUpdateResponsables(bulkEditRows.value, payload)
      handleCloseSelection()
    } else {
      await updateResponsables(asignacionIdToEditRespons.value, userIdToEditRespons.value, payload)
    }
    showEditarResponsables.value = false
    showToast('Edición exitosa')
  } catch {
    serviceErrorResponsables.value = 'Por favor, inténtalo en unos minutos'
  }
}

watch(showAsignarDrawer, (isOpen) => {
  if (!isOpen) setMode('create')
})

async function handleSubmit(payload) {
  try {
    const mensaje = await createAsignacion(payload)
    showAsignarDrawer.value = false
    showToast(mensaje)
  } catch {
    serviceError.value = 'Por favor, inténtalo en unos minutos'
  }
}

function requireCiclo() {
  if (selectedCicloId.value != null) return true
  showToast('Debes seleccionar un ciclo antes de continuar', 'warning')
  return false
}

function openAsignarDrawer() {
  if (requireCiclo()) showAsignarDrawer.value = true
}

function openMasivoUpload() {
  if (requireCiclo()) showMasivoUpload.value = true
}

async function handleMasivoSubmit({ results }) {
  showMasivoUpload.value = false
  await fetchAsignaciones()
  showToast(`Carga masiva: ${results?.ok ?? 0} registro(s) guardado(s)`)
}

const toolbarButtons = [
  { type: 'download', label: 'Descargar', onClick: () => {} },
  {
    type: 'add',
    label: 'Asignar KPI',
    items: [
      { label: 'Unitario', onClick: openAsignarDrawer },
      { label: 'Masivo',   onClick: openMasivoUpload },
    ],
  },
]

const tableColumns = [
  { key: 'persona',          name: 'Persona',             align: 'left'  },
  { key: 'cantKpis',         name: 'Cant KPIs',           align: 'right' },
  { key: 'ponderacion',      name: 'Ponderación total',   align: 'left'  },
  { key: 'periodoMedicion',  name: 'Periodo de medición', align: 'left'  },
  { key: 'cargaMetas',       name: 'Carga metas',         align: 'left'  },
  { key: 'validaMetas',      name: 'Valida metas',        align: 'left'  },
  { key: 'cargaResultados',  name: 'Carga resultados',    align: 'left'  },
  { key: 'validaResultados', name: 'Valida resultados',   align: 'left'  },
]

const showDeleteModal     = ref(false)
const asignacionToDelete  = ref(null)
const showBulkDeleteModal = ref(false)

const bulkSource = computed(() => {
  const selectedIds = new Set(selectedAsignaciones.value.map(String))
  return tableRows.value.filter(r => selectedIds.has(String(r.id)))
})

const bulkDeleteTitle = computed(() => {
  const n = bulkSource.value.length
  return `¿Realmente quieres eliminar las asignaciones de ${n} persona${n !== 1 ? 's' : ''}?`
})

const selectedCiclo = computed(() =>
  ciclos.value.find(c => c.id === selectedCicloId.value) ?? null,
)
const isCentralizado = computed(() => selectedCiclo.value?.tipoCiclo === 'centralizado')

const rowActions = computed(() => {
  const actions = [
    {
      label: 'Ver detalle',
      onClick: (row) => {
        const [asignacionId, userId] = String(row.id).split('_')
        router.push({
          name:   'asignacion-detalle',
          params: { asignacionId, userId },
          query:  { cicloId: selectedCicloId.value },
        })
      },
    },
  ]
  if (isCentralizado.value) {
    actions.push({
      label:   'Editar responsables',
      onClick: (row) => {
        asignacionIdToEditRespons.value = row.asignacionId
        userIdToEditRespons.value = row.userId
        showEditarResponsables.value = true
      },
    })
  }
  actions.push({ label: 'Eliminar', onClick: (row) => { asignacionToDelete.value = row; showDeleteModal.value = true } })
  return actions
})

const { showToast } = useToast()

async function handleDelete() {
  await deleteAsignacion(asignacionToDelete.value.asignacionId, asignacionToDelete.value.userId)
  showDeleteModal.value = false
  asignacionToDelete.value = null
  showToast('Asignación eliminada con éxito')
}

async function handleBulkDelete() {
  const miembros = bulkSource.value.map(r => ({ asignacionId: r.asignacionId, userId: r.userId }))
  await bulkDeleteAsignaciones(miembros)
  showBulkDeleteModal.value = false
  selectedAsignaciones.value = []
  dataTableRef.value?.clearSelection()
  showToast('Asignación eliminada con éxito')
}

function ponderacionVariant(val) {
  if (val > 100) return 'danger'
  if (val < 100) return 'warning'
  return 'success'
}
</script>

<template>
  <AppToolbar
    v-if="!showMasivoUpload"
    v-model:filter-values="filterValues"
    :filters="filterConfig"
    :buttons="isEmpty ? [] : toolbarButtons"
  />

  <AsignacionMasivoUpload
    v-if="showMasivoUpload"
    :ciclos-options="cicloOptions"
    :ciclos="ciclos"
    :kpis="kpis"
    :asignaciones="asignaciones"
    @cancel="showMasivoUpload = false"
    @submit="handleMasivoSubmit"
  />

  <EmptyState
    v-else-if="!hasCiclos"
    title="Aún no tienes ciclos creados"
    description="Crea un ciclo KPI para poder asignar KPI a personas"
    button-label="Ir a Ciclos"
    :show-add-icon="false"
    @click="router.push({ name: 'ciclos' })"
  />

  <EmptyState
    v-else-if="!hasKpis"
    title="Aún no tienes KPI creados"
    description="Crea al menos un KPI para poder asignarlo a personas"
    button-label="Ir a KPI"
    :show-add-icon="false"
    @click="router.push({ name: 'kpi' })"
  />

  <EmptyState
    v-else-if="isEmpty"
    title="Aún no tienes asignaciones para este ciclo"
    description="Asigna personas a KPI en este ciclo para comenzar"
    button-label="Asignar KPI"
    :items="[
      { label: 'Unitario', onClick: openAsignarDrawer },
      { label: 'Masivo',   onClick: openMasivoUpload },
    ]"
  />

  <DataTable
    v-else
    ref="dataTableRef"
    v-model:selected="selectedAsignaciones"
    :data-head="tableColumns"
    :data-body="tableRows"
    :row-actions="rowActions"
    :selectable="true"
    action-type="menu"
    @clear-search="search = ''"
  >
    <template #ponderacion="{ row }">
      <TChipStatus :variant="ponderacionVariant(row.ponderacion)">
        {{ row.ponderacion }}%
      </TChipStatus>
    </template>
  </DataTable>

  <Transition name="banner">
    <SelectionBanner
      v-if="selectedAsignaciones.length"
      :selected-count="selectedAsignaciones.length"
      :total-count="pageIds.length"
      :all-selected="allRowsSelected"
      @select-all="handleSelectAll"
      @close="handleCloseSelection"
    >
      <template #actions>
        <TButton
          v-if="isCentralizado"
          variant="primary"
          size="sm"
          style="outline: 1px solid rgba(255,255,255,0.25); outline-offset: -1px;"
          @click="openBulkEditarResponsables"
        >
          Editar responsables
        </TButton>
        <TButton
          variant="primary" size="sm" icon-left="material-symbols:delete-outline"
          style="outline: 1px solid rgba(255,255,255,0.25); outline-offset: -1px;"
          @click="showBulkDeleteModal = true"
        >
          Eliminar
        </TButton>
      </template>
    </SelectionBanner>
  </Transition>

  <FormDrawer
    v-model:show="showAsignarDrawer"
    v-model:service-error="serviceError"
    :config="drawerConfig"
    :initial-values="drawerInitialValues"
    @submit="handleSubmit"
  />

  <FormDrawer
    v-model:show="showEditarResponsables"
    v-model:service-error="serviceErrorResponsables"
    :config="drawerConfigResponsables"
    :initial-values="editarResponsablesInitialValues"
    @submit="handleEditarResponsablesSubmit"
  />

  <ConfirmModal
    v-model:show="showDeleteModal"
    title="¿Realmente quieres eliminar esta asignación?"
    description="Al eliminarla se perderá toda la información asociada."
    description-bold="Esta acción es irreversible"
    confirm-label="Eliminar"
    cancel-label="Cancelar"
    cancel-variant="tertiary"
    @confirm="handleDelete"
  />

  <ConfirmModal
    v-model:show="showBulkDeleteModal"
    :title="bulkDeleteTitle"
    description="Al eliminarlas se perderá la información asociada."
    description-bold="Esta acción es irreversible"
    confirm-label="Eliminar"
    cancel-label="Cancelar"
    cancel-variant="tertiary"
    @confirm="handleBulkDelete"
  />
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
