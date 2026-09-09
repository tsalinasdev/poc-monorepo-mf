// @ts-nocheck
import { computed } from 'vue'
import { METAS_ROLES_OPTIONS, RESULTADOS_ROLES_OPTIONS } from './useAsignacionDrawer'

// selectedCount: ref/computed opcional — cuando trae un valor > 0 (edición
// masiva desde el banner de selección), se muestra el chip "N registros
// seleccionados" a la altura de "Metas".
export function useEditarResponsablesDrawer({ selectedCount = null } = {}) {
  const drawerConfig = computed(() => ({
    title: 'Editar responsables',
    submitLabel: 'Editar',
    cancelLabel: 'Cancelar',
    cancelStyle: 'text',
    sections: [
      {
        title: 'Metas',
        description: 'Selecciona el rol responsable que administrará las metas del KPI',
        badge: selectedCount?.value ? `${selectedCount.value} registros seleccionados` : null,
        fields: [
          {
            key: 'cargaMetas',
            type: 'select',
            label: 'Carga',
            default: 'lider',
            size: 1,
            options: METAS_ROLES_OPTIONS,
          },
          {
            key: 'validaMetas',
            type: 'select',
            label: 'Valida',
            default: 'lider',
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
            default: 'lider',
            size: 1,
            options: RESULTADOS_ROLES_OPTIONS,
          },
          {
            key: 'validaResultados',
            type: 'select',
            label: 'Valida',
            default: 'lider',
            size: 1,
            options: RESULTADOS_ROLES_OPTIONS,
          },
        ],
      },
    ],
  }))

  return { drawerConfig }
}
