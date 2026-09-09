<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { computed, onMounted, ref, watch } from 'vue'
import { TSectionMessage } from '@talana/talanify-next'
import FormDrawer from '@/components/ui/FormDrawer.vue'
import DataTable from '@/components/ui/DataTable.vue'
import AppToolbar from '@/components/ui/AppToolbar.vue'
import EmptyState from '../components/shared/EmptyState.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { cicloToFormValues } from '../services/ciclosService'
import { useCiclos } from '../composables/useCiclos'
import { useCicloDrawer } from '../composables/useCicloDrawer'
import { useToast } from '@/composables/useToast'
import { useListView } from '@/composables/useListView'

const { tableRows, search, isEmpty, fetchCiclos, createCiclo, updateCiclo, deleteCiclo } =
  useCiclos()

const tableColumns = [
  { key: 'nombre', name: 'Nombre', align: 'left' },
  { key: 'cicloDesempeno', name: 'Ciclo desempeño', align: 'left' },
  { key: 'tipoCiclo', name: 'Tipo de ciclo', align: 'left' },
  { key: 'fechaInicio', name: 'Fecha de inicio', align: 'left' },
  { key: 'fechaFin', name: 'Fecha fin', align: 'left' },
  { key: 'fechaPlanificacion', name: 'Fecha planificación', align: 'left' },
  { key: 'limiteCumplimiento', name: 'Límite de cumplimiento', align: 'right' },
  { key: 'limitePersona', name: 'Límite KPI por persona', align: 'right' },
  { key: 'decimales', name: 'Cantidad de decimales', align: 'right' },
  { key: 'ponderadorMinimoLabel', name: 'Ponderador mínimo', align: 'left' },
  { key: 'verAcumulado', name: 'Ver acumulado', align: 'right' },
  { key: 'nivelesInterpretacion', name: 'Niveles de interpretación', align: 'right' },
  {
    key: 'estado',
    name: 'Estado',
    align: 'left',
    statusVariants: { activo: 'success', inactivo: 'secondary' },
  },
]

const { drawerConfig, mode: drawerMode, setMode } = useCicloDrawer()

const showDrawer = ref(false)
const showDeleteModal = ref(false)
const cicloToDelete = ref(null)
const cicloToEdit = ref(null)
const serviceError = ref(null)

const drawerInitialValues = computed(() =>
  cicloToEdit.value ? cicloToFormValues(cicloToEdit.value) : {},
)

watch(showDrawer, (isOpen) => {
  if (!isOpen) {
    cicloToEdit.value = null
    setMode('create')
  }
})

const { showToast } = useToast()

const { filterConfig, filterValues, toolbarButtons, rowActions } = useListView({
  search,
  addLabel: 'Agregar ciclo KPI',
  onAdd: () => {
    cicloToEdit.value = null
    setMode('create')
    showDrawer.value = true
  },
  onEdit: (row) => {
    cicloToEdit.value = row
    setMode('edit')
    showDrawer.value = true
  },
  onDelete: (row) => {
    cicloToDelete.value = row
    showDeleteModal.value = true
  },
})

const DELETE_ITEMS = [
  'Todos los KPIs creados en este ciclo.',
  'Metas, mediciones y avances registrados.',
  'Asociaciones y dependencias jerárquicas (KPIs padres e hijos).',
  'Ponderadores y lógicas de cálculo configuradas.',
]

async function handleSubmit(payload) {
  try {
    const mensaje =
      drawerMode.value === 'edit'
        ? await updateCiclo(cicloToEdit.value.id, payload)
        : await createCiclo(payload)
    showDrawer.value = false
    showToast(mensaje)
  } catch {
    serviceError.value = 'Por favor, inténtalo en unos minutos'
  }
}

async function handleDelete() {
  const mensaje = await deleteCiclo(cicloToDelete.value.id)
  showDeleteModal.value = false
  cicloToDelete.value = null
  showToast(mensaje)
}

onMounted(fetchCiclos)
</script>

<template>
  <AppToolbar
    v-if="!isEmpty"
    v-model:filter-values="filterValues"
    :filters="filterConfig"
    :buttons="toolbarButtons"
  />

  <TSectionMessage show variant="info" icon="mdi:information-slab-circle-outline">
    Los ciclos definen un período en cual se efectuará la medición de los KPI. Todos los KPI deben
    ser asociados a un ciclo.
  </TSectionMessage>

  <EmptyState
    v-if="isEmpty"
    title="Aún no tienes ciclos KPI creados"
    description="Crea un nuevo ciclo"
    button-label="Agregar ciclo KPI"
    @click="toolbarButtons[0].onClick()"
  />

  <DataTable
    v-else
    :data-head="tableColumns"
    :data-body="tableRows"
    :row-actions="rowActions"
    action-type="menu"
    @clear-search="search = ''"
  />

  <FormDrawer
    v-model:show="showDrawer"
    v-model:service-error="serviceError"
    :config="drawerConfig"
    :initial-values="drawerInitialValues"
    @submit="handleSubmit"
  />

  <ConfirmModal
    v-model:show="showDeleteModal"
    title="¿Realmente quieres eliminar este ciclo de KPI?"
    description="Esta acción es irreversible y eliminará permanentemente:"
    :items="DELETE_ITEMS"
    confirm-label="Eliminar"
    @confirm="handleDelete"
  />
</template>
