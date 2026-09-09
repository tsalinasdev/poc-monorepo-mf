// @ts-nocheck
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { USUARIOS_SEED } from '@api/configuracion/usuarios/get_usuarios.php.ts'
import kpisService from '../services/kpisService'
import ciclosService from '../services/ciclosService'
import asignacionesService, { responsablesToFormValues } from '../services/asignacionesService'
import { PERIODO_LABELS, generateMediciones } from '../utils/mediciones'
import { equalPonderaciones } from '../utils/ponderaciones'
import { useAsignacionNavigation } from './useAsignacionNavigation'

const ROL_LABELS = { lider: 'Líder', liderLider: 'Líder del líder', trabajador: 'Trabajador' }

function resolveUserName(id) {
  const u = USUARIOS_SEED.find((u) => u.id === id)
  return u ? `${u.nombre} ${u.apellido}` : `ID ${id}`
}

function resolveRolLabel(id) {
  const u = USUARIOS_SEED.find((u) => u.id === id)
  return u ? (ROL_LABELS[u.rolKpi] ?? '') : ''
}

export function useAsignacionDetalle() {
  const route = useRoute()

  const asignacionId = computed(() => Number(route.params.asignacionId))
  const userId = computed(() => Number(route.params.userId))
  const cicloId = computed(() => Number(route.query.cicloId))

  const asignacionesDelCiclo = ref([]) // todas las asignaciones del ciclo actual, para el detalle y la navegación prev/next
  const kpis = ref([])
  const ponderaciones = ref({})
  const allMediciones = ref({}) // { [kpiId]: MedicionRow[] }
  const isDirty = ref(false)

  const { hasPrev, hasNext, navigate, goBack } = useAsignacionNavigation(
    asignacionesDelCiclo,
    asignacionId,
    userId,
  )

  const asignacion = computed(
    () => asignacionesDelCiclo.value.find((a) => a.id === asignacionId.value) ?? null,
  )

  const usuario = computed(() => USUARIOS_SEED.find((u) => u.id === userId.value) ?? null)

  const personaNombre = computed(() =>
    usuario.value ? `${usuario.value.nombre} ${usuario.value.apellido}` : '',
  )

  const responsablesMetas = computed(() => ({
    carga: (asignacion.value?.cargaMetas ?? []).map((id) => ({
      nombre: resolveUserName(id),
      rol: resolveRolLabel(id),
    })),
    valida: (asignacion.value?.validaMetas ?? []).map((id) => ({
      nombre: resolveUserName(id),
      rol: resolveRolLabel(id),
    })),
  }))

  const responsablesResultados = computed(() => ({
    carga: (asignacion.value?.cargaResultados ?? []).map((id) => ({
      nombre: resolveUserName(id),
      rol: resolveRolLabel(id),
    })),
    valida: (asignacion.value?.validaResultados ?? []).map((id) => ({
      nombre: resolveUserName(id),
      rol: resolveRolLabel(id),
    })),
  }))

  const periodoLabel = computed(() => {
    if (!asignacion.value) return '—'
    const { periodoMedicion, numMediciones } = asignacion.value
    if (!periodoMedicion) return '—'
    return periodoMedicion === 'personalizado' && numMediciones
      ? `Personalizado (${numMediciones})`
      : (PERIODO_LABELS[periodoMedicion] ?? periodoMedicion)
  })

  const kpisDetalle = computed(() => {
    if (!asignacion.value) return []
    return kpis.value
      .filter((k) => asignacion.value.kpi.includes(k.id))
      .map((k) => ({
        ...k,
        ponderacion: ponderaciones.value[userId.value]?.[k.id] ?? 0,
        periodoLabel: periodoLabel.value,
      }))
  })

  // La ponderación de un KPI es propia de la persona que lo tiene asignado —
  // no se comparte entre las personas de una misma asignación grupal (mismo
  // criterio que las mediciones, ver getMedicionesForKpi/setMedicionesForKpi).
  const ponderacionTotal = computed(() =>
    Object.values(ponderaciones.value[userId.value] ?? {}).reduce(
      (s, v) => s + (Number(v) || 0),
      0,
    ),
  )

  const ponderacionVariant = computed(() => {
    const t = ponderacionTotal.value
    if (t === 100) return 'success'
    if (t > 100) return 'danger'
    return 'warning'
  })

  const porValidarTotal = computed(
    () =>
      Object.values(allMediciones.value[userId.value] ?? {})
        .flat()
        .filter((m) => m.estado === 'por_validar').length,
  )

  function setPonderacion(kpiId, value) {
    ponderaciones.value = {
      ...ponderaciones.value,
      [userId.value]: { ...ponderaciones.value[userId.value], [kpiId]: Number(value) || 0 },
    }
    isDirty.value = true
  }

  // Las mediciones (fecha inicio/fin, meta, estado) pertenecen a una persona
  // puntual dentro de un ciclo/bloque de tiempo — no se comparten entre las
  // personas de una misma asignación grupal (área/cargo), aunque compartan el
  // mismo `asignacionId`. Por eso `allMediciones` está indexado primero por
  // `userId` y luego por `kpiId`, y no por `kpiId` solo.
  function getMedicionesForKpi(kpiId) {
    return allMediciones.value[userId.value]?.[kpiId] ?? []
  }

  function setMedicionesForKpi(kpiId, rows) {
    allMediciones.value = {
      ...allMediciones.value,
      [userId.value]: { ...allMediciones.value[userId.value], [kpiId]: rows },
    }
    isDirty.value = true
  }

  // Reset/validar operan igual que el resto de esta pantalla: mutan el estado
  // local (marcan isDirty) y quedan pendientes hasta que el usuario presiona
  // "Guardar" — mismo comportamiento que ya tenían los botones por medición.
  // Alcance: solo las mediciones de la persona actualmente en pantalla.
  function applyToMediciones(predicate, nextEstado) {
    const currentUserMed = allMediciones.value[userId.value] ?? {}
    const updated = {}
    for (const [kpiId, rows] of Object.entries(currentUserMed)) {
      updated[kpiId] = rows.map((m) => (predicate(kpiId, m) ? { ...m, estado: nextEstado } : m))
    }
    allMediciones.value = { ...allMediciones.value, [userId.value]: updated }
    isDirty.value = true
  }

  function resetGlobal() {
    applyToMediciones(() => true, 'por_cargar')
  }

  function resetKpi(kpiId) {
    applyToMediciones((id) => String(id) === String(kpiId), 'por_cargar')
  }

  function validateAll() {
    applyToMediciones((id, m) => m.estado === 'por_validar', 'validado')
  }

  function validateKpi(kpiId) {
    applyToMediciones(
      (id, m) => String(id) === String(kpiId) && m.estado === 'por_validar',
      'validado',
    )
  }

  function getEditResponsablesInitialValues() {
    return asignacion.value ? responsablesToFormValues(asignacion.value, userId.value) : {}
  }

  async function updateResponsablesForCurrent(payload) {
    if (!asignacion.value) return 'Asignación no encontrada'
    const { mensaje } = await asignacionesService.updateResponsables(
      asignacion.value,
      userId.value,
      payload,
    )
    await loadData()
    return mensaje
  }

  async function removeAsignacion() {
    const { mensaje } = await asignacionesService.remove(asignacionId.value, userId.value)
    goBack()
    return mensaje
  }

  async function saveAll() {
    if (!asignacion.value) return 'Asignación no encontrada'
    await asignacionesService.updateDetalle(asignacionId.value, {
      kpiPonderaciones: { ...ponderaciones.value },
      kpiMediciones: { ...allMediciones.value },
    })
    await fetchAsignacionesDelCiclo()
    isDirty.value = false
    return 'Cambios guardados con éxito'
  }

  async function fetchAsignacionesDelCiclo() {
    asignacionesDelCiclo.value = await asignacionesService.getAll(cicloId.value)
  }

  async function loadData() {
    await fetchAsignacionesDelCiclo()
    const fresh = asignacion.value
    if (!fresh) return

    allMediciones.value = {}
    const [kpisList, ciclosList] = await Promise.all([kpisService.getAll(), ciclosService.getAll()])
    kpis.value = kpisList

    const ciclo = ciclosList.find((c) => c.id === cicloId.value) ?? null
    const metaDefault = ciclo?.limiteCumplimiento ?? null

    // kpiPonderaciones vive por persona, mismo criterio que kpiMediciones.
    const savedPond = fresh.kpiPonderaciones ?? {}
    const shares = equalPonderaciones(fresh.kpi.length)
    const currentUserPond = { ...savedPond[userId.value] }
    fresh.kpi.forEach((id, i) => {
      currentUserPond[id] = currentUserPond[id] ?? shares[i] ?? 0
    })
    ponderaciones.value = { ...savedPond, [userId.value]: currentUserPond }

    // kpiMediciones vive por persona: se preservan las de otras personas del
    // mismo grupo ya guardadas y se generan las de la persona actual si aún
    // no existen — nunca se derivan de un default compartido por el grupo.
    const savedMed = fresh.kpiMediciones ?? {}
    const currentUserMed = { ...savedMed[userId.value] }
    fresh.kpi.forEach((id) => {
      currentUserMed[id] =
        currentUserMed[id] ??
        generateMediciones(fresh.periodoMedicion, fresh.numMediciones, metaDefault)
    })
    allMediciones.value = { ...savedMed, [userId.value]: currentUserMed }

    isDirty.value = false
  }

  watch([asignacionId, userId, cicloId], loadData)
  onMounted(loadData)

  return {
    asignacion,
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
  }
}
