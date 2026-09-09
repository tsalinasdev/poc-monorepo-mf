<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { ref, computed, watch, onMounted } from 'vue'
import { TButtonIcon, TChipStatus, TTable, TInput, TButton } from '@talana/talanify-next'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const props = defineProps({
  kpi:        { type: Object, required: true },
  mediciones: { type: Array,  default: () => [] },
})

const emit = defineEmits(['update:ponderacion', 'update:mediciones', 'reset-kpi', 'validate-kpi'])

const open            = ref(false)
const localMediciones = ref([])

let _syncingFromProp = false

onMounted(() => {
  _syncingFromProp = true
  localMediciones.value = props.mediciones.map(m => ({ ...m }))
})

watch(() => props.mediciones, (newVal) => {
  if (JSON.stringify(newVal) !== JSON.stringify(localMediciones.value)) {
    _syncingFromProp = true
    localMediciones.value = newVal.map(m => ({ ...m }))
  }
}, { deep: true })

watch(localMediciones, (val) => {
  if (_syncingFromProp) { _syncingFromProp = false; return }
  emit('update:mediciones', val)
}, { deep: true, flush: 'sync' })

const porValidarCount = computed(() =>
  localMediciones.value.filter(m => m.estado === 'por_validar').length
)

// TInput solo entrega el valor (v-model), no el InputEvent nativo — la detección
// de "borrado" se infiere comparando cantidad de dígitos contra el valor anterior.
function onDateInput(value, m, field) {
  const prevDigits = (m[field] ?? '').replace(/\D/g, '')
  const digits = value.replace(/\D/g, '').slice(0, 8)
  const isDeleting = digits.length < prevDigits.length
  let formatted = digits
  if (digits.length > 4)
    formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
  else if (digits.length === 4 && !isDeleting)
    formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/'
  else if (digits.length > 2)
    formatted = digits.slice(0, 2) + '/' + digits.slice(2)
  else if (digits.length === 2 && !isDeleting)
    formatted = digits + '/'
  m[field] = formatted
}

const medicionesColumns = [
  { key: 'label', name: 'Periodo de medición' },
  { key: 'fechaInicio', name: 'Fecha de inicio' },
  { key: 'fechaFin', name: 'Fecha de finalización' },
  { key: 'meta', name: 'Meta', width: 192 },
  { key: 'estado', name: 'Estado', width: 192 },
  { key: 'actions', name: 'Acciones', width: 80, align: 'center' },
]

const TIPO_CALCULO_LABEL = {
  ponderado: 'Ponderado', directo: 'Directo', tabla: 'Tabla',
  funcion: 'Función', indirecto: 'Indirecto',
}

const ESTADO_VARIANT = {
  validado: 'success', por_validar: 'warning', por_cargar: 'info',
}
const ESTADO_LABEL = {
  validado: 'Validado', por_validar: 'Por validar', por_cargar: 'Por cargar',
}

const showResetMedicionModal = ref(false)
const medicionToReset        = ref(null)

function handleResetMedicion(m) {
  medicionToReset.value = m
  showResetMedicionModal.value = true
}

function confirmResetMedicion() {
  medicionToReset.value.estado = 'por_cargar'
  showResetMedicionModal.value = false
  medicionToReset.value = null
}
</script>

<template>
  <!-- bg-ExtendColors-Primary-ExtraLight = #F3F1FF -->
  <div style="background:#F3F1FF;border-radius:0.5rem;overflow:hidden;">

    <!-- Header acordeón -->
    <div
      style="padding:1rem;display:flex;justify-content:flex-start;align-items:center;gap:0.75rem;cursor:pointer;user-select:none;"
      @click="open = !open"
    >

      <!-- Lado izquierdo: icono + nombre + separadores + tipo + periodo -->
      <div style="flex:1;display:flex;justify-content:flex-start;align-items:center;gap:0.75rem;">

        <!-- Icono KPI (mismo que tab KPI, color gray-900) -->
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
          <path d="M7.33262 21.2221C6.70913 21.2095 6.11662 21.0543 5.55512 20.7566C4.99346 20.459 4.46496 20.0189 3.96962 19.4364C3.28712 18.6244 2.75437 17.6532 2.37137 16.5229C1.98837 15.3927 1.79688 14.2284 1.79688 13.0299C1.79688 11.6142 2.06471 10.2839 2.60037 9.03888C3.13604 7.79388 3.86304 6.71088 4.78137 5.78988C5.69971 4.86888 6.77954 4.13971 8.02087 3.60238C9.26221 3.06521 10.5886 2.79663 12.0001 2.79663C13.4123 2.79663 14.7395 3.0683 15.9816 3.61163C17.2236 4.15496 18.3035 4.89513 19.2211 5.83213C20.1388 6.76913 20.8652 7.86805 21.4004 9.12888C21.9357 10.3895 22.2034 11.7422 22.2034 13.1869C22.2034 14.5022 21.988 15.7321 21.5574 16.8766C21.1269 18.0211 20.5183 18.9847 19.7316 19.7674C19.249 20.2419 18.7421 20.603 18.2111 20.8506C17.68 21.0983 17.1402 21.2221 16.5919 21.2221C16.282 21.2221 15.9721 21.1836 15.6621 21.1066C15.3521 21.0296 15.0421 20.9141 14.7321 20.7601L13.3144 20.0541C13.1144 19.9541 12.9051 19.8791 12.6866 19.8291C12.4683 19.7791 12.2378 19.7541 11.9951 19.7541C11.7525 19.7541 11.5206 19.7791 11.2996 19.8291C11.0786 19.8791 10.8673 19.9545 10.6656 20.0551L9.25413 20.7589C8.93479 20.9264 8.61696 21.0486 8.30062 21.1256C7.98429 21.2026 7.66162 21.2348 7.33262 21.2221ZM7.38463 19.0189C7.52979 19.0189 7.67754 19.0022 7.82787 18.9689C7.97821 18.9355 8.12638 18.8792 8.27238 18.7999L9.68438 18.0939C10.0464 17.9065 10.4208 17.7692 10.8076 17.6819C11.1945 17.5945 11.5855 17.5509 11.9809 17.5509C12.3764 17.5509 12.7697 17.5945 13.1609 17.6819C13.5522 17.7692 13.9269 17.9045 14.2849 18.0879L15.7219 18.7999C15.8679 18.8792 16.0124 18.9355 16.1554 18.9689C16.2984 19.0022 16.4414 19.0189 16.5844 19.0189C16.8862 19.0189 17.1748 18.9385 17.4501 18.7779C17.7255 18.6172 18.0028 18.3742 18.2821 18.0489C18.8195 17.4155 19.2391 16.6552 19.5411 15.7679C19.8431 14.8807 19.9941 13.9684 19.9941 13.0309C19.9941 10.7975 19.2191 8.90171 17.6691 7.34338C16.1191 5.78505 14.2295 5.00588 12.0001 5.00588C9.77079 5.00588 7.88112 5.78921 6.33112 7.35588C4.78112 8.92255 4.00613 10.8225 4.00613 13.0559C4.00613 14.0099 4.16029 14.9359 4.46863 15.8339C4.77696 16.7319 5.20613 17.4912 5.75612 18.1119C6.03546 18.4332 6.30413 18.6647 6.56213 18.8064C6.82013 18.948 7.09429 19.0189 7.38463 19.0189ZM12.0001 15.1374C12.59 15.1374 13.0937 14.9286 13.5114 14.5111C13.9289 14.0935 14.1376 13.5897 14.1376 12.9999C14.1376 12.8679 14.1251 12.7359 14.1001 12.6039C14.0751 12.4719 14.0396 12.3392 13.9936 12.2059L15.1301 10.6981C15.2808 10.907 15.4126 11.1253 15.5256 11.3531C15.6386 11.581 15.7329 11.8285 15.8084 12.0956H18.0676C17.8056 10.5571 17.1045 9.2983 15.9644 8.31913C14.824 7.33996 13.5026 6.85038 12.0001 6.85038C10.4976 6.85038 9.17204 7.34413 8.02338 8.33163C6.87488 9.31913 6.17604 10.5738 5.92688 12.0956H8.18587C8.41921 11.1876 8.89129 10.4546 9.60212 9.89663C10.3128 9.33863 11.1121 9.05963 12.0001 9.05963C12.259 9.05963 12.5025 9.08163 12.7309 9.12563C12.9592 9.16963 13.1821 9.23571 13.3996 9.32388L12.2381 10.8814C12.2065 10.8814 12.1668 10.8782 12.1191 10.8719C12.0715 10.8655 12.0318 10.8624 12.0001 10.8624C11.4103 10.8624 10.9065 11.0711 10.4889 11.4886C10.0714 11.9063 9.86263 12.41 9.86263 12.9999C9.86263 13.5897 10.0714 14.0935 10.4889 14.5111C10.9065 14.9286 11.4103 15.1374 12.0001 15.1374Z" fill="#27273f"/>
        </svg>

        <!-- Info group: nombre | sep | tipo | sep | periodo -->
        <div style="display:flex;align-items:center;gap:1.5rem;">

          <!-- Nombre KPI -->
          <span style="font-size:1rem;font-weight:700;color:#0E0E19;font-family:'Inter',sans-serif;line-height:1.5rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;">
            {{ kpi.nombreKpi }}
          </span>

          <!-- Separador vertical (w-10 rotate-90 = 40px vertical) -->
          <div style="width:1px;height:40px;background:#CFD8DC;flex-shrink:0;" />

          <!-- Tipo de cálculo -->
          <div style="display:flex;flex-direction:column;flex-shrink:0;">
            <span style="font-size:0.875rem;font-weight:400;color:#0E0E19;font-family:'Inter',sans-serif;line-height:1.25rem;">Tipo de calculo:</span>
            <span style="font-size:1rem;font-weight:700;color:#0E0E19;font-family:'Inter',sans-serif;line-height:1.5rem;">
              {{ TIPO_CALCULO_LABEL[kpi.tipoCalculo] ?? kpi.tipoCalculo }}
            </span>
          </div>

          <!-- Separador vertical -->
          <div style="width:1px;height:40px;background:#CFD8DC;flex-shrink:0;" />

          <!-- Periodo de medición -->
          <div style="display:flex;flex-direction:column;flex-shrink:0;">
            <span style="font-size:0.875rem;font-weight:400;color:#0E0E19;font-family:'Inter',sans-serif;line-height:1.25rem;">Periodo de medición:</span>
            <span style="font-size:1rem;font-weight:700;color:#0E0E19;font-family:'Inter',sans-serif;line-height:1.5rem;">
              {{ kpi.periodoLabel || '—' }}
            </span>
          </div>

        </div>
      </div>

      <!-- Lado derecho: ponderación + botones + chevron -->
      <div style="display:flex;justify-content:flex-end;align-items:center;gap:0.75rem;" @click.stop>

        <!-- Label "Ponderación" -->
        <span style="font-size:1rem;font-weight:700;color:#0E0E19;font-family:'Inter',sans-serif;line-height:1.5rem;text-align:right;flex-shrink:0;">
          Ponderación
        </span>

        <!-- Input ponderación: blanco, outline, icono % izquierda, número derecha -->
        <div style="width:7rem;height:2.5rem;padding:0.375rem 0.5rem;background:#FFFFFF;border-radius:0.5rem;outline:1px solid #CFD8DC;display:inline-flex;justify-content:flex-start;align-items:center;gap:0.5rem;box-sizing:border-box;">
          <iconify-icon icon="material-symbols:percent" style="font-size:14px;color:#0E0E19;flex-shrink:0;" />
          <input
            type="number"
            min="0"
            max="100"
            :value="kpi.ponderacion"
            style="flex:1;border:none;outline:none;background:transparent;font-size:0.875rem;font-weight:500;color:#0E0E19;font-family:'Inter',sans-serif;line-height:1.25rem;text-align:right;min-width:0;"
            @input="emit('update:ponderacion', $event.target.value)"
          />
        </div>

        <!-- Reset -->
        <TButtonIcon
          icon="material-symbols:restart-alt"
          variant="tertiary"
          size="sm"
          aria-label="Resetear KPI"
          style="flex-shrink:0;"
          @click="emit('reset-kpi')"
        />

        <!-- Validar -->
        <TButton
          variant="tertiary"
          icon-left="material-symbols:check-circle-outline"
          :disabled="porValidarCount === 0"
          @click="emit('validate-kpi')"
        >
          Validar ({{ porValidarCount }})
        </TButton>

        <!-- Chevron -->
        <div style="padding:0.25rem;border-radius:0.5rem;flex-shrink:0;cursor:pointer;" @click.stop="open = !open">
          <iconify-icon
            :icon="open ? 'material-symbols:keyboard-arrow-up' : 'material-symbols:keyboard-arrow-down'"
            style="font-size:20px;color:#0E0E19;display:block;"
          />
        </div>

      </div>
    </div>

    <!-- Tabla de mediciones (expandida) -->
    <div v-if="open" style="padding:1rem;border-top:1px solid #CFD8DC;">
      <TTable :data-head="medicionesColumns" :data-body="localMediciones" size="sm" hidden-pagination>
        <template #fechaInicio="{ row }">
          <TInput
            :model-value="row.fechaInicio"
            placeholder="dd/mm/aaaa"
            @update:model-value="v => onDateInput(v, row, 'fechaInicio')"
          />
        </template>
        <template #fechaFin="{ row }">
          <TInput
            :model-value="row.fechaFin"
            placeholder="dd/mm/aaaa"
            @update:model-value="v => onDateInput(v, row, 'fechaFin')"
          />
        </template>
        <template #meta="{ row }">
          <TInput v-model="row.meta" placeholder="—" />
        </template>
        <template #estado="{ row }">
          <TChipStatus :variant="ESTADO_VARIANT[row.estado] ?? 'secondary'">
            {{ ESTADO_LABEL[row.estado] ?? row.estado }}
          </TChipStatus>
        </template>
        <template #actions="{ row }">
          <div style="display:flex;justify-content:center;align-items:center;gap:0.25rem;">
            <TButtonIcon
              icon="material-symbols:restart-alt"
              variant="tertiary"
              size="sm"
              aria-label="Resetear"
              :disabled="row.estado === 'por_cargar'"
              @click="handleResetMedicion(row)"
            />
            <TButtonIcon
              icon="material-symbols:check-circle-outline"
              variant="tertiary"
              size="sm"
              aria-label="Validar"
              :disabled="row.estado === 'validado'"
              @click="row.estado = 'validado'"
            />
          </div>
        </template>
      </TTable>
    </div>

    <ConfirmModal
      v-model:show="showResetMedicionModal"
      title="¿Realmente quieres resetear esta medición?"
      description="El reseteo de estado aplicará únicamente para el periodo seleccionado."
      description-bold="Esta acción es irreversible."
      confirm-label="Resetear"
      cancel-label="Cancelar"
      cancel-variant="tertiary"
      @confirm="confirmResetMedicion"
    />

  </div>
</template>
