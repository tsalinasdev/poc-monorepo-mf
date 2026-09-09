import { ref, computed, watch, type ComputedRef, type Ref } from 'vue'
import asignacionesService, {
  responsablesToFormValues,
  type ResponsablesFormValues,
} from '../services/asignacionesService'
import type { PutAsignacionBody } from '@api/configuracion/asignaciones/put_asignacion.php.ts'
import type { PostAsignacionBody } from '@api/configuracion/asignaciones/post_asignacion.php.ts'
import type { MiembroRef } from '@api/configuracion/asignaciones/delete_asignacion.php.ts'
import type { Asignacion } from '@api/configuracion/asignaciones/types'
import { useSelectedCiclo } from './useSelectedCiclo'
import { useAsyncList } from './useAsyncList'
import { equalPonderaciones } from '../utils/ponderaciones'
import { PERIODO_LABELS } from '../utils/mediciones'
import { resolveGroupUsers, resolveResponsableName } from '../utils/asignacionUsuarios'
import { filterBySearch } from '../utils/textFilter'

export interface AsignacionTableRow {
  id: string
  asignacionId: number
  userId: number
  persona: string
  cantKpis: number
  ponderacion: number
  periodoMedicion: string
  cargaMetas: string
  validaMetas: string
  cargaResultados: string
  validaResultados: string
}

export interface UseAsignaciones {
  asignaciones: Ref<Asignacion[]>
  tableRows: ComputedRef<AsignacionTableRow[]>
  loading: Ref<boolean>
  error: Ref<unknown>
  search: Ref<string>
  selectedCicloId: Ref<number | null>
  isEmpty: ComputedRef<boolean>
  fetchAsignaciones: () => Promise<void>
  createAsignacion: (data: PostAsignacionBody) => Promise<string>
  getAsignacionById: (id: number) => Asignacion | null
  getResponsablesInitialValues: (id: number, userId: number) => ResponsablesFormValues
  updateResponsables: (id: number, userId: number, payload: PutAsignacionBody) => Promise<string>
  bulkUpdateResponsables: (rows: MiembroRef[], payload: PutAsignacionBody) => Promise<string>
  deleteAsignacion: (id: number, userId: number) => Promise<string>
  bulkDeleteAsignaciones: (miembros: MiembroRef[]) => Promise<string>
}

export function useAsignaciones(): UseAsignaciones {
  const search = ref('')
  const { selectedCicloId } = useSelectedCiclo()
  const {
    list: asignaciones,
    loading,
    error,
    refresh,
  } = useAsyncList<Asignacion>(async () => {
    if (selectedCicloId.value == null) return []
    return asignacionesService.getAll(selectedCicloId.value)
  })

  const isEmpty = computed(() => asignaciones.value.length === 0)

  const tableRows = computed<AsignacionTableRow[]>(() => {
    const rows = asignaciones.value.flatMap((a) => {
      const excluidos = a.excluidos ?? []
      const groupUsers = resolveGroupUsers(a).filter((u) => !excluidos.includes(u.id))

      const periodo = PERIODO_LABELS[a.periodoMedicion] ?? a.periodoMedicion

      // Ponderación en partes iguales entre los KPI de la asignación, salvo
      // que ya se haya guardado una distribución manual desde el detalle.
      // kpiPonderaciones vive por persona — no se comparte entre las personas
      // de una misma asignación grupal.
      const shares = equalPonderaciones(a.kpi.length)
      const savedPond: Record<number, number> = a.kpiPonderaciones ?? {}

      return groupUsers.map((u) => {
        // Ponderaciones en kpi-project se guardan planas por KPI; no se
        // acota por persona. Aquí sumamos todas las ponderaciones (es la
        // métrica "cobertura de ponderación" que muestra la tabla).
        const ponderacionTotal = a.kpi.reduce(
          (sum, kpiId, i) => sum + (savedPond[kpiId] ?? shares[i] ?? 0),
          0,
        )
        return {
          id: `${a.id}_${u.id}`,
          asignacionId: a.id,
          userId: u.id,
          persona: `${u.nombre} ${u.apellido}`,
          cantKpis: a.kpi.length,
          ponderacion: ponderacionTotal,
          periodoMedicion:
            a.periodoMedicion === 'personalizado' && a.numMediciones
              ? `Personalizado (${a.numMediciones})`
              : periodo,
          cargaMetas: resolveResponsableName(a, u, 'cargaMetas'),
          validaMetas: resolveResponsableName(a, u, 'validaMetas'),
          cargaResultados: resolveResponsableName(a, u, 'cargaResultados'),
          validaResultados: resolveResponsableName(a, u, 'validaResultados'),
        }
      })
    })

    return filterBySearch(rows, search.value, (r, t) => r.persona.toLowerCase().includes(t))
  })

  async function fetchAsignaciones(): Promise<void> {
    if (!selectedCicloId.value) return
    await refresh()
  }

  async function createAsignacion(data: PostAsignacionBody): Promise<string> {
    if (selectedCicloId.value == null) return ''
    const { mensaje } = await asignacionesService.create(selectedCicloId.value, data)
    await fetchAsignaciones()
    return mensaje
  }

  function getAsignacionById(id: number): Asignacion | null {
    return asignaciones.value.find((a) => a.id === id) ?? null
  }

  function getResponsablesInitialValues(id: number, userId: number): ResponsablesFormValues {
    const asignacion = getAsignacionById(id)
    if (!asignacion) {
      return {
        cargaMetas: 'ninguno',
        validaMetas: 'ninguno',
        cargaResultados: 'ninguno',
        validaResultados: 'ninguno',
      }
    }
    return responsablesToFormValues(asignacion, userId)
  }

  async function updateResponsables(
    id: number,
    userId: number,
    payload: PutAsignacionBody,
  ): Promise<string> {
    const asignacion = getAsignacionById(id)
    if (!asignacion) return ''
    const { mensaje } = await asignacionesService.updateResponsables(asignacion, userId, payload)
    await fetchAsignaciones()
    return mensaje
  }

  // rows: MiembroRef[] — puede abarcar varias asignaciones distintas; se agrupa
  // para actualizar cada una en un solo write.
  async function bulkUpdateResponsables(
    rows: MiembroRef[],
    payload: PutAsignacionBody,
  ): Promise<string> {
    const userIdsByAsignacion = new Map<number, number[]>()
    for (const { asignacionId, userId } of rows) {
      if (!userIdsByAsignacion.has(asignacionId)) userIdsByAsignacion.set(asignacionId, [])
      userIdsByAsignacion.get(asignacionId)!.push(userId)
    }

    let mensaje = ''
    for (const [asignacionId, userIds] of userIdsByAsignacion) {
      const asignacion = getAsignacionById(asignacionId)
      if (!asignacion) continue
      const result = await asignacionesService.bulkUpdateResponsables(asignacion, userIds, payload)
      mensaje = result.mensaje
    }
    await fetchAsignaciones()
    return mensaje
  }

  async function deleteAsignacion(id: number, userId: number): Promise<string> {
    const { mensaje } = await asignacionesService.remove(id, userId)
    await fetchAsignaciones()
    return mensaje
  }

  async function bulkDeleteAsignaciones(miembros: MiembroRef[]): Promise<string> {
    const { mensaje } = await asignacionesService.bulkRemove(miembros)
    await fetchAsignaciones()
    return mensaje
  }

  watch(selectedCicloId, () => fetchAsignaciones())

  return {
    asignaciones,
    tableRows,
    loading,
    error,
    search,
    selectedCicloId,
    isEmpty,
    fetchAsignaciones,
    createAsignacion,
    getAsignacionById,
    getResponsablesInitialValues,
    updateResponsables,
    bulkUpdateResponsables,
    deleteAsignacion,
    bulkDeleteAsignaciones,
  }
}
