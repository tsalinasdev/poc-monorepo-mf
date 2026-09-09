import { ref, computed, type ComputedRef, type Ref } from 'vue'
import kpisService from '../services/kpisService'
import type { Kpi } from '@api/configuracion/kpis/types'
import { useAsyncList } from './useAsyncList'
import { filterBySearch } from '../utils/textFilter'
import type { KpiFormValues } from '../services/kpisService'

export interface UseKpis {
  kpis: Ref<Kpi[]>
  filteredKpis: ComputedRef<Kpi[]>
  search: Ref<string>
  loading: Ref<boolean>
  error: Ref<unknown>
  isEmpty: ComputedRef<boolean>
  fetchKpis: () => Promise<void>
  deleteKpi: (id: number) => Promise<string>
  disassociateKpi: (id: number) => Promise<string>
  bulkDeleteKpis: (ids: readonly (number | string)[]) => Promise<void>
  bulkDisassociateKpis: (ids: readonly (number | string)[]) => Promise<void>
  bulkAssociateKpis: (ids: readonly (number | string)[], padreId: number) => Promise<void>
  saveKpi: (payload: KpiFormValues, kpiToEdit: Kpi | null) => Promise<string>
}

export function useKpis(): UseKpis {
  const {
    list: kpis,
    loading,
    error,
    refresh: fetchKpis,
  } = useAsyncList<Kpi>(() => kpisService.getAll())
  const search = ref('')

  const filteredKpis = computed(() =>
    filterBySearch(kpis.value, search.value, (k, t) => k.nombreKpi.toLowerCase().includes(t)),
  )

  const isEmpty = computed(() => kpis.value.length === 0)

  async function deleteKpi(id: number): Promise<string> {
    const { mensaje } = await kpisService.remove(id)
    await fetchKpis()
    return mensaje
  }

  async function disassociateKpi(id: number): Promise<string> {
    const { mensaje } = await kpisService.disassociate(id)
    await fetchKpis()
    return mensaje
  }

  async function bulkDeleteKpis(ids: readonly (number | string)[]): Promise<void> {
    await Promise.all(ids.map((id) => kpisService.remove(Number(id))))
    await fetchKpis()
  }

  async function bulkDisassociateKpis(ids: readonly (number | string)[]): Promise<void> {
    await Promise.all(ids.map((id) => kpisService.disassociate(Number(id))))
    await fetchKpis()
  }

  async function bulkAssociateKpis(
    ids: readonly (number | string)[],
    padreId: number,
  ): Promise<void> {
    await Promise.all(ids.map((id) => kpisService.associate(Number(id), padreId)))
    await fetchKpis()
  }

  // Crea o edita un KPI y, si queda como 'padre', sincroniza sus KPI hijos
  // (asocia los nuevos, desasocia los que ya no están) en un solo refetch.
  async function saveKpi(payload: KpiFormValues, kpiToEdit: Kpi | null): Promise<string> {
    const isCreate = !kpiToEdit
    const prevHijoIds = isCreate
      ? []
      : kpis.value.filter((k) => k.kpiPadre === kpiToEdit!.id).map((k) => k.id)
    const nextHijoIds = payload.dependencia === 'padre' ? (payload.kpiHijos ?? []).map(Number) : []

    let mensaje: string
    let padreId: number | undefined = kpiToEdit?.id
    if (isCreate) {
      const result = await kpisService.create(payload)
      mensaje = result.mensaje
      padreId = result.id
    } else {
      mensaje = (await kpisService.update(kpiToEdit!.id, payload)).mensaje
    }

    if (payload.dependencia === 'padre' && padreId !== undefined) {
      const toAssociate = nextHijoIds.filter((id) => !prevHijoIds.includes(id))
      const toDisassociate = prevHijoIds.filter((id) => !nextHijoIds.includes(id))
      await Promise.all([
        ...toAssociate.map((id) => kpisService.associate(id, padreId!)),
        ...toDisassociate.map((id) => kpisService.disassociate(id)),
      ])
    }

    await fetchKpis()
    return mensaje
  }

  return {
    kpis,
    filteredKpis,
    search,
    loading,
    error,
    isEmpty,
    fetchKpis,
    deleteKpi,
    disassociateKpi,
    bulkDeleteKpis,
    bulkDisassociateKpis,
    bulkAssociateKpis,
    saveKpi,
  }
}
