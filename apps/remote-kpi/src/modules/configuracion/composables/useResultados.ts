// @ts-nocheck
import { ref, computed, watch } from 'vue'
import resultadosService from '../services/resultadosService'
import { useSelectedCiclo } from './useSelectedCiclo'
import { useAsyncList } from './useAsyncList'
import { filterBySearch } from '../utils/textFilter'

export function useResultados() {
  const search = ref('')
  const { selectedCicloId } = useSelectedCiclo()
  const {
    list: resultados,
    loading,
    error,
    refresh,
  } = useAsyncList(() => resultadosService.getAll(selectedCicloId.value))
  const edits = ref({}) // { [rowId]: number | null } — cambios de resultado sin guardar

  const isEmpty = computed(() => resultados.value.length === 0)
  const isDirty = computed(() => Object.keys(edits.value).length > 0)

  const tableRows = computed(() => {
    const rows = resultados.value.map((r) => {
      if (!(r.id in edits.value)) return r
      const resultado = edits.value[r.id]
      const meta = Number(r.meta) || 0
      return {
        ...r,
        resultado,
        cumplimiento: meta > 0 ? Math.round(((Number(resultado) || 0) / meta) * 100) : 0,
        estado: r.estado === 'validado' ? 'validado' : 'por_validar',
      }
    })

    return filterBySearch(
      rows,
      search.value,
      (r, t) => r.persona.toLowerCase().includes(t) || r.kpiNombre.toLowerCase().includes(t),
    )
  })

  const stats = computed(() => {
    const counts = { validado: 0, por_validar: 0, por_cargar: 0, por_definir: 0 }
    resultados.value.forEach((r) => {
      counts[r.estado] += 1
    })
    const total = resultados.value.length
    const conResultado = counts.validado + counts.por_validar
    return {
      total,
      conResultado,
      porcentaje: total > 0 ? Math.round((conResultado / total) * 100) : 0,
      ...counts,
    }
  })

  async function fetchResultados() {
    if (!selectedCicloId.value) {
      resultados.value = []
      return
    }
    await refresh()
    edits.value = {}
  }

  function setResultado(rowId, value) {
    edits.value = { ...edits.value, [rowId]: value === '' ? null : Number(value) }
  }

  async function saveAll() {
    const payload = Object.entries(edits.value)
      .filter(([, resultado]) => resultado !== null)
      .map(([rowId, resultado]) => {
        const row = resultados.value.find((r) => r.id === rowId)
        return {
          asignacionId: row.asignacionId,
          userId: row.userId,
          kpiId: row.kpiId,
          medicionId: row.medicionId,
          resultado,
        }
      })

    if (!payload.length) return 'No hay cambios para guardar'

    const { mensaje } = await resultadosService.saveResultados(payload)
    await fetchResultados()
    return mensaje
  }

  async function resetRow(row) {
    const { mensaje } = await resultadosService.resetResultado(
      row.asignacionId,
      row.userId,
      row.kpiId,
      row.medicionId,
    )
    await fetchResultados()
    return mensaje
  }

  async function validateRow(row) {
    if (row.id in edits.value) await saveAll()
    const { mensaje } = await resultadosService.validateResultado(
      row.asignacionId,
      row.userId,
      row.kpiId,
      row.medicionId,
    )
    await fetchResultados()
    return mensaje
  }

  async function bulkValidateRows(rows) {
    if (rows.some((r) => r.id in edits.value)) await saveAll()
    const items = rows.map((r) => ({
      asignacionId: r.asignacionId,
      userId: r.userId,
      kpiId: r.kpiId,
      medicionId: r.medicionId,
    }))
    const { mensaje } = await resultadosService.validateMany(items)
    await fetchResultados()
    return mensaje
  }

  watch(selectedCicloId, fetchResultados)

  return {
    tableRows,
    stats,
    loading,
    error,
    search,
    selectedCicloId,
    isEmpty,
    isDirty,
    fetchResultados,
    setResultado,
    saveAll,
    resetRow,
    validateRow,
    bulkValidateRows,
  }
}
