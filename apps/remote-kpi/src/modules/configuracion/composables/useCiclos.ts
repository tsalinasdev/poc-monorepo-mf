import { ref, computed, type ComputedRef, type Ref } from 'vue'
import ciclosService from '../services/ciclosService'
import type { Ciclo } from '@api/configuracion/ciclos/types'
import { useAsyncList } from './useAsyncList'
import { filterBySearch } from '../utils/textFilter'
import type { CicloFormValues } from '../services/ciclosService'

export interface CicloTableRow extends Ciclo {
  ponderadorMinimoLabel: number | 'No'
}

export interface UseCiclos {
  ciclos: Ref<Ciclo[]>
  filteredCiclos: ComputedRef<Ciclo[]>
  tableRows: ComputedRef<CicloTableRow[]>
  search: Ref<string>
  loading: Ref<boolean>
  error: Ref<unknown>
  isEmpty: ComputedRef<boolean>
  fetchCiclos: () => Promise<void>
  createCiclo: (payload: CicloFormValues) => Promise<string>
  updateCiclo: (id: number, payload: CicloFormValues) => Promise<string>
  deleteCiclo: (id: number) => Promise<string>
}

export function useCiclos(): UseCiclos {
  const {
    list: ciclos,
    loading,
    error,
    refresh: fetchCiclos,
  } = useAsyncList<Ciclo>(() => ciclosService.getAll())
  const search = ref('')

  const filteredCiclos = computed(() =>
    filterBySearch(ciclos.value, search.value, (c, t) => c.nombre.toLowerCase().includes(t)),
  )

  const tableRows = computed<CicloTableRow[]>(() =>
    filteredCiclos.value.map((c) => ({
      ...c,
      ponderadorMinimoLabel: c.ponderadorMinimo == null ? 'No' : c.ponderadorMinimo,
    })),
  )

  const isEmpty = computed(() => ciclos.value.length === 0)

  async function createCiclo(payload: CicloFormValues): Promise<string> {
    const { mensaje } = await ciclosService.create(payload)
    await fetchCiclos()
    return mensaje
  }

  async function updateCiclo(id: number, payload: CicloFormValues): Promise<string> {
    const { mensaje } = await ciclosService.update(id, payload)
    await fetchCiclos()
    return mensaje
  }

  async function deleteCiclo(id: number): Promise<string> {
    const { mensaje } = await ciclosService.remove(id)
    await fetchCiclos()
    return mensaje
  }

  return {
    ciclos,
    filteredCiclos,
    tableRows,
    search,
    loading,
    error,
    isEmpty,
    fetchCiclos,
    createCiclo,
    updateCiclo,
    deleteCiclo,
  }
}
