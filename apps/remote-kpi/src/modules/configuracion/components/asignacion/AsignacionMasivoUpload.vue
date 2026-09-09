<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { ref, watch } from 'vue'
import MasivoUploadShell from '@/components/ui/MasivoUploadShell.vue'
import asignacionesService from '../../services/asignacionesService'
import { METAS_ROLES_OPTIONS, RESULTADOS_ROLES_OPTIONS } from '../../composables/useAsignacionDrawer'
import { downloadCsv } from '@/utils/exportCsv'
import { USUARIOS_SEED, AREAS_SEED } from '@api/configuracion/usuarios/get_usuarios.php.ts'

const props = defineProps({
  ciclosOptions: { type: Array, default: () => [] }, // { label: nombre, value: id }
  ciclos:        { type: Array, default: () => [] },
  kpis:          { type: Array, default: () => [] },
  asignaciones:  { type: Array, default: () => [] },
})

const emit = defineEmits(['cancel', 'submit'])

const INSTRUCTIONS = [
  'Cabecera sin modificar.',
  'Separación por ";" (punto y coma).',
  'Que no contenga espacios en blanco al inicio ni final.',
  'Que los textos no tengan carácter ";" (punto y coma).',
]

const selectedCiclo = ref(null)
// TUploadFile sin `multiple` entrega un solo File (o null), no un array.
const uploadedFile = ref(null)

const phase   = ref('idle')
const results = ref(null)

const EXPECTED_HEADER = ['Accion', 'RUT', 'KPI_ID', 'Area', 'PeriodoMedicion', 'CargaMetas', 'ValidaMetas', 'CargaResultados', 'ValidaResultados']
const PERIODOS_VALIDOS = ['anual', 'semestral', 'cuatrimestral', 'trimestral', 'bimestral', 'mensual', 'quincenal', 'semanal', 'diario', 'personalizado']
const METAS_ROLES_VALIDOS      = METAS_ROLES_OPTIONS.map((o) => o.value)
const RESULTADOS_ROLES_VALIDOS = RESULTADOS_ROLES_OPTIONS.map((o) => o.value)

const ERROR_COLUMNS = [
  { key: 'fila',   name: 'N° de fila' },
  { key: 'motivo', name: 'Motivo de error' },
]

const TEMPLATE_CSV = [
  'Accion;RUT;KPI_ID;Area;PeriodoMedicion;CargaMetas;ValidaMetas;CargaResultados;ValidaResultados',
  '0: agregar 1: editar;12345678-9;101;Tecnología;mensual;lider;liderLider;trabajador;ninguno',
  '0;98765432-1;102;Recursos Humanos;trimestral;trabajador;lider;lider;lider',
].join('\n')

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'template_asignacion_kpi.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function downloadErrorReport() {
  downloadCsv('reporte_errores_asignacion.csv', ERROR_COLUMNS, results.value?.errors ?? [])
}

// Validación de formato (alcance frontend): estructura, existencia de
// referencias (RUT/KPI) y valores permitidos. No implementa reglas de
// negocio del backend real (permisos, duplicados server-side, etc.).
// `workingList` es una copia mutable de props.asignaciones que se va
// actualizando fila a fila — si no, una fila "editar" no vería la
// asignación creada por una fila "agregar" anterior en el mismo archivo.
function findExistente(workingList, userId, kpiId) {
  return workingList.find((a) => a.persona?.includes(userId) && a.kpi?.includes(kpiId))
}

function validateRow(cols, cicloNombre, workingList) {
  const [accion, rut, kpiId, area, periodo, cargaMetas, validaMetas, cargaResultados, validaResultados] = cols

  if (!['0', '1'].includes(accion)) return 'Acción debe ser 0 (agregar) o 1 (editar)'

  const user = USUARIOS_SEED.find((u) => u.rut === rut)
  if (!user) return `No existe una persona con RUT ${rut}`

  if (area) {
    const areaNombre = AREAS_SEED.find((a) => a.id === user.areaId)?.nombre
    if (areaNombre !== area) return `El área "${area}" no coincide con el área real de ${user.nombre} (${areaNombre})`
  }

  const kpi = props.kpis.find((k) => String(k.id) === kpiId)
  if (!kpi) return `No existe un KPI con ID ${kpiId}`
  if (kpi.cicloKpi !== cicloNombre) return `El KPI ${kpiId} no pertenece al ciclo seleccionado`

  if (!PERIODOS_VALIDOS.includes(periodo)) return `Periodo de medición "${periodo}" no es válido`
  if (!METAS_ROLES_VALIDOS.includes(cargaMetas))           return `CargaMetas "${cargaMetas}" no es un rol válido`
  if (!METAS_ROLES_VALIDOS.includes(validaMetas))          return `ValidaMetas "${validaMetas}" no es un rol válido`
  if (!RESULTADOS_ROLES_VALIDOS.includes(cargaResultados)) return `CargaResultados "${cargaResultados}" no es un rol válido`
  if (!RESULTADOS_ROLES_VALIDOS.includes(validaResultados)) return `ValidaResultados "${validaResultados}" no es un rol válido`

  if (accion === '1' && !findExistente(workingList, user.id, kpi.id)) {
    return `No existe una asignación previa de ${user.nombre} ${user.apellido} para el KPI ${kpiId} (usa Acción 0 para agregar)`
  }

  return null
}

async function processRow(cols, cicloId, workingList) {
  const [accion, rut, kpiId, , periodo, cargaMetas, validaMetas, cargaResultados, validaResultados] = cols
  const user = USUARIOS_SEED.find((u) => u.rut === rut)
  const kpi  = props.kpis.find((k) => String(k.id) === kpiId)
  const roles = { cargaMetas, validaMetas, cargaResultados, validaResultados }

  // TODO (futuro Claude): reemplazar por la llamada real de importación
  // masiva cuando exista backend — hoy persiste fila a fila contra el mock
  // de localStorage vía asignacionesService, igual que el resto de la app.
  if (accion === '1') {
    const existente = findExistente(workingList, user.id, kpi.id)
    await asignacionesService.updateResponsables(existente, user.id, roles)
  } else {
    const { id } = await asignacionesService.create(cicloId, {
      tipoAsignacion: 'persona',
      persona: [user.id],
      area: [],
      cargo: [],
      kpi: [kpi.id],
      periodoMedicion: periodo,
      numMediciones: null,
      ...roles,
    })
    // Entrada mínima para que una fila "editar" posterior en el mismo
    // archivo pueda encontrar esta asignación recién creada.
    workingList.push({ id, tipoAsignacion: 'persona', persona: [user.id], area: [], cargo: [], kpi: [kpi.id], responsablesOverrides: {} })
  }
}

async function processFile(file) {
  phase.value = 'processing'
  await new Promise((resolve) => setTimeout(resolve, 400))

  const cicloId = selectedCiclo.value
  const cicloNombre = props.ciclos.find((c) => c.id === cicloId)?.nombre

  const text = await file.text()
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  const header = lines[0]?.split(';').map((h) => h.trim())

  if (JSON.stringify(header) !== JSON.stringify(EXPECTED_HEADER)) {
    results.value = { total: 0, ok: 0, errors: [{ fila: 1, motivo: 'La cabecera del archivo no coincide con la plantilla' }] }
    phase.value = 'done'
    return
  }

  const dataLines = lines.slice(1)
  const errors = []
  let ok = 0
  const workingList = [...props.asignaciones]

  for (let i = 0; i < dataLines.length; i++) {
    const fila = i + 2
    const cols = dataLines[i].split(';').map((c) => c.trim())
    const motivo = validateRow(cols, cicloNombre, workingList)
    if (motivo) { errors.push({ fila, motivo }); continue }

    try {
      await processRow(cols, cicloId, workingList)
      ok++
    } catch {
      errors.push({ fila, motivo: 'Error al guardar el registro' })
    }
  }

  results.value = { total: dataLines.length, ok, errors }
  phase.value = 'done'

  if (errors.length === 0 && ok > 0) uploadedFile.value = null
}

watch([uploadedFile, selectedCiclo], ([file, ciclo]) => {
  if (file && ciclo && phase.value === 'idle') processFile(file)
})

function handleFinish() {
  emit('submit', { ciclo: selectedCiclo.value, results: results.value })
}
</script>

<template>
  <MasivoUploadShell
    title="Asignar KPI masivamente"
    subtitle="Asegúrate de revisar las instrucciones antes de realizar la carga masiva."
    :instructions="INSTRUCTIONS"
    :ciclos-options="ciclosOptions"
    v-model:selected-ciclo="selectedCiclo"
    v-model:uploaded-file="uploadedFile"
    :phase="phase"
    :results="results"
    require-ciclo
    @download-template="downloadTemplate"
    @download-error-report="downloadErrorReport"
    @cancel="emit('cancel')"
    @finish="handleFinish"
  />
</template>
