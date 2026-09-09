// @ts-nocheck
import { ref, computed } from 'vue'
import { required } from '@/utils/validators'

const TIPO_ASIGNACION_OPTIONS = [
  { label: 'Por área', value: 'area' },
  { label: 'Por nivel de cargo', value: 'nivelCargo' },
  { label: 'Por persona', value: 'persona' },
]

const PERIODO_OPTIONS = [
  { label: 'Anual', value: 'anual' },
  { label: 'Semestral', value: 'semestral' },
  { label: 'Cuatrimestral', value: 'cuatrimestral' },
  { label: 'Trimestral', value: 'trimestral' },
  { label: 'Bimestral', value: 'bimestral' },
  { label: 'Mensual', value: 'mensual' },
  { label: 'Quincenal', value: 'quincenal' },
  { label: 'Semanal', value: 'semanal' },
  { label: 'Diario', value: 'diario' },
  { label: 'Personalizado', value: 'personalizado' },
]

export const METAS_ROLES_OPTIONS = [
  { label: 'Administrador', value: 'administrador' },
  { label: 'Líder', value: 'lider' },
  { label: 'Líder del líder', value: 'liderLider' },
  { label: 'Trabajador', value: 'trabajador' },
]

export const RESULTADOS_ROLES_OPTIONS = [
  { label: 'Ninguno', value: 'ninguno' },
  { label: 'Administrador', value: 'administrador' },
  { label: 'Líder', value: 'lider' },
  { label: 'Líder del líder', value: 'liderLider' },
  { label: 'Trabajador', value: 'trabajador' },
]

// Sugerencia de responsables según tipo de ciclo. Centralizado sugiere
// Administrador (editable); Top-down/Bottom-up fijan carga/valida por rol
// y quedan de solo lectura (no tiene sentido reasignarlos manualmente).
const RESPONSABLES_POR_TIPO_CICLO = {
  centralizado: { carga: 'administrador', valida: 'administrador', locked: false },
  'bottom-up': { carga: 'trabajador', valida: 'lider', locked: true },
  'top-down': { carga: 'lider', valida: 'trabajador', locked: true },
}

export function useAsignacionDrawer({
  areaOptions = ref([]),
  cargoOptions = ref([]),
  personaOptions = ref([]),
  kpiOptions = ref([]),
  tipoCiclo = ref(null),
} = {}) {
  const mode = ref('create')

  function setMode(m) {
    mode.value = m
  }

  const drawerConfig = computed(() => {
    const responsables = RESPONSABLES_POR_TIPO_CICLO[tipoCiclo.value] ?? {
      carga: 'lider',
      valida: 'lider',
      locked: false,
    }

    return {
      title: mode.value === 'edit' ? 'Editar asignación' : 'Asignar KPI',
      submitLabel: mode.value === 'edit' ? 'Guardar cambios' : 'Asignar',
      cancelLabel: 'Cancelar',
      cancelStyle: 'text',
      sections: [
        {
          title: 'Configuración principal',
          description:
            'Asigna personas, define periodicidad y quienes se encargarán de actualizar los resultados.',
          banner: true,
          fields: [
            {
              key: 'tipoAsignacion',
              type: 'radio',
              default: 'area',
              size: 1,
              inline: 3,
              options: TIPO_ASIGNACION_OPTIONS,
            },
            {
              key: 'area',
              type: 'multiselect',
              label: 'Área',
              placeholder: 'Selecciona un área',
              size: 1,
              default: [],
              rules: [required],
              visible: (fd) => fd.tipoAsignacion === 'area',
              options: () => areaOptions.value,
            },
            {
              key: 'cargo',
              type: 'multiselect',
              label: 'Cargo',
              placeholder: 'Selecciona un cargo',
              size: 1,
              default: [],
              rules: [required],
              visible: (fd) => fd.tipoAsignacion === 'nivelCargo',
              options: () => cargoOptions.value,
            },
            {
              key: 'persona',
              type: 'multiselect',
              label: 'Persona',
              placeholder: 'Selecciona una persona',
              size: 1,
              default: [],
              rules: [required],
              visible: (fd) => fd.tipoAsignacion === 'persona',
              options: () => personaOptions.value,
            },
            {
              key: 'kpi',
              type: 'multiselect',
              label: 'KPI',
              placeholder: 'Selecciona un KPI',
              size: 1,
              default: [],
              rules: [required],
              options: () => kpiOptions.value,
            },
            {
              key: 'periodoMedicion',
              type: 'select',
              label: 'Periodo de medición',
              placeholder: 'Selecciona un periodo de medición',
              default: 'mensual',
              size: (fd) => (fd.periodoMedicion === 'personalizado' ? '1/2' : 1),
              options: PERIODO_OPTIONS,
            },
            {
              key: 'numMediciones',
              type: 'number',
              label: 'Número de mediciones',
              size: '1/2',
              default: 1,
              min: 1,
              visible: (fd) => fd.periodoMedicion === 'personalizado',
            },
          ],
        },
        {
          title: 'Metas',
          description: 'Selecciona el rol responsable que administrará las metas del KPI',
          fields: [
            {
              key: 'cargaMetas',
              type: 'select',
              label: 'Carga',
              default: responsables.carga,
              disabled: responsables.locked,
              size: 1,
              options: METAS_ROLES_OPTIONS,
            },
            {
              key: 'validaMetas',
              type: 'select',
              label: 'Valida',
              default: responsables.valida,
              disabled: responsables.locked,
              size: 1,
              options: METAS_ROLES_OPTIONS,
            },
          ],
        },
        {
          title: 'Resultados',
          description: 'Selecciona el rol que administra los resultados del KPI',
          fields: [
            {
              key: 'cargaResultados',
              type: 'select',
              label: 'Carga',
              default: responsables.carga,
              disabled: responsables.locked,
              size: 1,
              options: RESULTADOS_ROLES_OPTIONS,
            },
            {
              key: 'validaResultados',
              type: 'select',
              label: 'Valida',
              default: responsables.valida,
              disabled: responsables.locked,
              size: 1,
              options: RESULTADOS_ROLES_OPTIONS,
            },
          ],
        },
      ],
    }
  })

  return { drawerConfig, mode, setMode }
}
