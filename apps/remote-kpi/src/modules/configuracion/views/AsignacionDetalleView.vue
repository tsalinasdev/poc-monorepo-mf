<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { TButton, TButtonIcon, TChipStatus, TEmptyState, TCard } from '@talana/talanify-next'
import DetalleHeader    from '../components/asignacion/DetalleHeader.vue'
import ResponsablesCard from '../components/asignacion/ResponsablesCard.vue'
import DetalleKpiCard   from '../components/asignacion/DetalleKpiCard.vue'
import ConfirmModal     from '@/components/ui/ConfirmModal.vue'
import FormDrawer        from '@/components/ui/FormDrawer.vue'
import { useAsignacionDetalle } from '../composables/useAsignacionDetalle'
import { useEditarResponsablesDrawer } from '../composables/useEditarResponsablesDrawer'
import { useToast } from '@/composables/useToast'
import { downloadCsv } from '@/utils/exportCsv'

const route = useRoute()
const { showToast } = useToast()

const DETALLE_COLUMNS = [
  { key: 'nombreKpi',    name: 'KPI' },
  { key: 'tipoCalculo',  name: 'Tipo de cálculo' },
  { key: 'periodoLabel', name: 'Periodo de medición' },
  { key: 'ponderacion',  name: 'Ponderación' },
]

const {
  personaNombre,
  responsablesMetas,
  responsablesResultados,
  kpisDetalle,
  ponderacionTotal,
  ponderacionVariant,
  porValidarTotal,
  isDirty,
  hasPrev,
  hasNext,
  navigate,
  goBack,
  setPonderacion,
  getMedicionesForKpi,
  setMedicionesForKpi,
  resetGlobal,
  resetKpi,
  validateAll,
  validateKpi,
  getEditResponsablesInitialValues,
  updateResponsablesForCurrent,
  removeAsignacion,
  saveAll,
} = useAsignacionDetalle()

function handleDownload() {
  downloadCsv(`asignacion_${personaNombre.value}.csv`, DETALLE_COLUMNS, kpisDetalle.value)
}

async function handleSave() {
  await saveAll()
  showToast('Asignación guardada con éxito')
}

const showUnsavedModal = ref(false)
const pendingDelta     = ref(null)

function handleNavigate(delta) {
  if (isDirty.value) {
    pendingDelta.value = delta
    showUnsavedModal.value = true
  } else {
    navigate(delta)
  }
}

function confirmNavigate() {
  showUnsavedModal.value = false
  navigate(pendingDelta.value)
  pendingDelta.value = null
}

const showResetGlobalModal = ref(false)
const showResetKpiModal    = ref(false)
const kpiIdToReset         = ref(null)

function handleResetKpi(kpiId) {
  kpiIdToReset.value = kpiId
  showResetKpiModal.value = true
}

function confirmResetGlobal() {
  resetGlobal()
  showResetGlobalModal.value = false
  showToast('Estados reseteados')
}

function confirmResetKpi() {
  resetKpi(kpiIdToReset.value)
  showResetKpiModal.value = false
  kpiIdToReset.value = null
  showToast('Estados del KPI reseteados')
}

function handleValidateAll() {
  validateAll()
  showToast('Mediciones validadas')
}

function handleValidateKpi(kpiId) {
  validateKpi(kpiId)
  showToast('Mediciones del KPI validadas')
}

const showDeleteModal = ref(false)

async function handleDelete() {
  const mensaje = await removeAsignacion()
  showDeleteModal.value = false
  showToast(mensaje)
}

const showEditResponsables = ref(false)
const serviceError = ref(null)
const { drawerConfig: drawerConfigResponsables } = useEditarResponsablesDrawer()
const editResponsablesInitialValues = computed(() => getEditResponsablesInitialValues())

async function handleEditResponsablesSubmit(payload) {
  try {
    const mensaje = await updateResponsablesForCurrent(payload)
    showEditResponsables.value = false
    showToast(mensaje)
  } catch {
    serviceError.value = 'Por favor, inténtalo en unos minutos'
  }
}

const PONDERACION_ICON = {
  success: 'material-symbols:check-circle-outline',
  warning: 'material-symbols:warning-outline',
  danger:  'material-symbols:error-outline',
}
</script>

<template>
  <div style="display:flex;flex-direction:column;gap:1rem;">

    <!-- Encabezado (sobre el fondo gris, fuera del card) -->
    <DetalleHeader
      :persona-nombre="personaNombre"
      :has-prev="hasPrev"
      :has-next="hasNext"
      @back="goBack"
      @prev="handleNavigate(-1)"
      @next="handleNavigate(1)"
    />

    <!-- Card blanca: responsables + KPIs + footer -->
    <TCard rounded-size="md" body-classes="flex flex-col gap-5">

    <!-- Responsables -->
    <div style="display:flex;gap:1rem;">
      <ResponsablesCard
        title="Metas"
        icon="material-symbols:account-tree"
        :carga="responsablesMetas.carga"
        :valida="responsablesMetas.valida"
      />
      <ResponsablesCard
        title="Resultados"
        icon="material-symbols:trending-up"
        :carga="responsablesResultados.carga"
        :valida="responsablesResultados.valida"
      />
    </div>

    <!-- Encabezado lista KPIs -->
    <div style="display:flex;align-items:center;gap:0.75rem;">
      <span style="font-size:1rem;font-weight:700;color:#1C1B1F;font-family:'Inter',sans-serif;">
        Listado de KPIs ({{ kpisDetalle.length }})
      </span>

      <!-- Chip ponderación -->
      <TChipStatus :variant="ponderacionVariant" :icon="PONDERACION_ICON[ponderacionVariant]">
        Ponderación: {{ ponderacionTotal }}%
      </TChipStatus>

      <div style="flex:1;" />

      <TButtonIcon
        icon="material-symbols:download"
        variant="secondary"
        aria-label="Descargar Excel"
        @click="handleDownload"
      />
      <TButtonIcon
        icon="material-symbols:restart-alt"
        variant="secondary"
        aria-label="Resetear todos"
        @click="showResetGlobalModal = true"
      />
      <TButton variant="secondary" icon-left="material-symbols:edit" @click="showEditResponsables = true">
        Editar responsables
      </TButton>
    </div>

    <!-- Lista KPIs -->
    <div style="display:flex;flex-direction:column;gap:0.625rem;">
      <DetalleKpiCard
        v-for="kpi in kpisDetalle"
        :key="`${route.params.asignacionId}-${route.params.userId}-${kpi.id}`"
        :kpi="kpi"
        :mediciones="getMedicionesForKpi(kpi.id)"
        @update:ponderacion="val => setPonderacion(kpi.id, val)"
        @update:mediciones="rows => setMedicionesForKpi(kpi.id, rows)"
        @reset-kpi="handleResetKpi(kpi.id)"
        @validate-kpi="handleValidateKpi(kpi.id)"
      />
      <TEmptyState
        v-if="!kpisDetalle.length"
        illustration="box"
        title="No hay KPIs asignados a esta persona"
      />
    </div>

    <template #actions>
      <div style="display:flex;align-items:center;">
        <TButton variant="tertiary" @click="goBack">Cancelar</TButton>
        <div style="flex:1;" />
        <div style="display:flex;gap:0.5rem;">
          <TButton variant="secondary" icon-left="material-symbols:delete-outline" @click="showDeleteModal = true">
            Eliminar
          </TButton>
          <TButton variant="secondary" :disabled="!porValidarTotal" @click="handleValidateAll">
            Validar ({{ porValidarTotal }})
          </TButton>
          <TButton variant="primary" @click="handleSave">Guardar</TButton>
        </div>
      </div>
    </template>
    </TCard>
  </div>

  <FormDrawer
    v-model:show="showEditResponsables"
    v-model:service-error="serviceError"
    :config="drawerConfigResponsables"
    :initial-values="editResponsablesInitialValues"
    @submit="handleEditResponsablesSubmit"
  />

  <ConfirmModal
    v-model:show="showResetGlobalModal"
    title="¿Realmente quieres resetear todos los KPI?"
    description="El reseteo de estado aplicará para todos los KPIs de esta asignación."
    description-bold="Esta acción es irreversible."
    confirm-label="Resetear"
    cancel-label="Cancelar"
    cancel-variant="tertiary"
    @confirm="confirmResetGlobal"
  />

  <ConfirmModal
    v-model:show="showResetKpiModal"
    title="¿Realmente quieres resetear este KPI?"
    description="El reseteo de metas y estado aplicará únicamente para el KPI seleccionado."
    description-bold="Esta acción es irreversible."
    confirm-label="Resetear"
    cancel-label="Cancelar"
    cancel-variant="tertiary"
    @confirm="confirmResetKpi"
  />

  <ConfirmModal
    v-model:show="showDeleteModal"
    title="¿Realmente quieres eliminar esta asignación?"
    description="Al eliminarla se perderá toda la información asociada a esta persona."
    description-bold="Esta acción es irreversible."
    confirm-label="Eliminar"
    cancel-label="Cancelar"
    cancel-variant="tertiary"
    @confirm="handleDelete"
  />

  <ConfirmModal
    v-model:show="showUnsavedModal"
    title="¿Realmente quieres cambiar de persona?"
    description="Existen cambios sin guardar, al continuar perderás los datos ingresados para esta persona."
    description-bold="Esta acción es irreversible."
    confirm-label="Continuar sin guardar"
    cancel-label="Cancelar"
    confirm-variant="primary"
    cancel-variant="tertiary"
    @confirm="confirmNavigate"
  />
</template>
