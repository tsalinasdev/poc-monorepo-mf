<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { ref, watch } from 'vue'
import MasivoUploadShell from '@/components/ui/MasivoUploadShell.vue'
import resultadosService from '../../services/resultadosService'
import { downloadCsv } from '@/utils/exportCsv'

defineProps({
  ciclosOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['cancel', 'submit'])

const INSTRUCTIONS = [
  'Cabecera sin modificar.',
  'Separación por ";" (punto y coma).',
  'La columna "CodigoMedicion" tal cual viene en la plantilla descargada.',
  'Que los textos no tengan carácter ";" (punto y coma).',
]

const selectedCiclo = ref(null)
// TUploadFile sin `multiple` entrega un solo File (o null), no un array.
const uploadedFile  = ref(null)

const phase   = ref('idle')
const results = ref(null) // { total, ok, errors: [{ fila, motivo }] }

const TIPO_CALCULO_LABEL = {
  ponderado: 'Ponderado', directo: 'Directo', tabla: 'Tabla', funcion: 'Función', indirecto: 'Indirecto',
}
const ESTADO_LABEL = {
  validado: 'Validado', por_validar: 'Por validar', por_cargar: 'Por cargar', por_definir: 'Por definir',
}

// Concepto tomado del backend legacy (iwi/gkpi): identifica cada fila por un
// ID técnico de la medición puntual (CodigoMedicion), no por KPI+persona —
// necesario porque un mismo KPI+persona puede tener N mediciones (mensual,
// trimestral, etc). El usuario no lo edita, solo descarga y vuelve a subir.
const EXPECTED_HEADER = ['CodigoMedicion', 'KpiNombre', 'PersonaNombre', 'PersonaRUT', 'TipoCalculo', 'PeriodoMedicion', 'Meta', 'EstadoActual', 'Resultado']

const TEMPLATE_COLUMNS = [
  { key: 'id',            name: 'CodigoMedicion' },
  { key: 'kpiNombre',     name: 'KpiNombre' },
  { key: 'persona',       name: 'PersonaNombre' },
  { key: 'personaRut',    name: 'PersonaRUT' },
  { key: 'tipoCalculo',   name: 'TipoCalculo',    format: (r) => TIPO_CALCULO_LABEL[r.tipoCalculo] ?? r.tipoCalculo },
  { key: 'periodoLabel',  name: 'PeriodoMedicion' },
  { key: 'meta',          name: 'Meta' },
  { key: 'estado',        name: 'EstadoActual',   format: (r) => ESTADO_LABEL[r.estado] ?? r.estado },
  { key: 'resultado',     name: 'Resultado',      format: (r) => r.resultado ?? '' },
]

const ERROR_COLUMNS = [
  { key: 'fila',   name: 'N° de fila' },
  { key: 'motivo', name: 'Motivo de error' },
]

async function downloadTemplate() {
  if (!selectedCiclo.value) return
  const rows = await resultadosService.getAll(selectedCiclo.value)
  downloadCsv('template_resultados.csv', TEMPLATE_COLUMNS, rows)
}

function downloadErrorReport() {
  downloadCsv('reporte_errores_resultados.csv', ERROR_COLUMNS, results.value?.errors ?? [])
}

// Validación de formato (alcance frontend): existencia del código de
// medición y tipo de dato del resultado. Solo el CodigoMedicion identifica
// la fila — el resto de las columnas son de referencia y no se revalidan
// (mismo criterio que el backend legacy, que ubica por ID y no por
// coincidencia de columnas).
function validateRow(cols, currentRows) {
  const [codigoMedicion] = cols
  const resultado = cols[8]
  if (!currentRows.some((r) => r.id === codigoMedicion)) return `No existe una medición con código ${codigoMedicion}`
  if (resultado === '' || resultado === undefined) return 'Resultado es requerido'
  if (Number.isNaN(Number(resultado))) return 'Resultado debe ser un número'
  if (Number(resultado) < 0) return 'Resultado no puede ser negativo'
  return null
}

async function processFile(file) {
  phase.value = 'processing'
  // Espera artificial para simular el procesamiento — reemplazar por el
  // estado real de la request cuando exista backend.
  await new Promise((resolve) => setTimeout(resolve, 400))

  const currentRows = await resultadosService.getAll(selectedCiclo.value)

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

  for (let i = 0; i < dataLines.length; i++) {
    const fila = i + 2 // fila 1 es la cabecera
    const cols = dataLines[i].split(';').map((c) => c.trim())
    const motivo = validateRow(cols, currentRows)
    if (motivo) { errors.push({ fila, motivo }); continue }

    try {
      const row = currentRows.find((r) => r.id === cols[0])
      // TODO (futuro Claude): reemplazar por la llamada real de importación
      // masiva cuando exista backend — hoy persiste fila a fila contra el
      // mock de localStorage vía resultadosService, igual que el resto de la app.
      await resultadosService.saveResultados([{
        asignacionId: row.asignacionId,
        userId:       row.userId,
        kpiId:        row.kpiId,
        medicionId:   row.medicionId,
        resultado:    Number(cols[8]),
      }])
      ok++
    } catch {
      errors.push({ fila, motivo: 'Error al guardar el registro' })
    }
  }

  results.value = { total: dataLines.length, ok, errors }
  phase.value = 'done'

  // Éxito total: deja el selector listo para otra carga sin cerrar la vista.
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
    title="Cargar resultados masivamente"
    subtitle="Selecciona un ciclo y descarga la plantilla con las mediciones pendientes antes de realizar la carga."
    :instructions="INSTRUCTIONS"
    :ciclos-options="ciclosOptions"
    v-model:selected-ciclo="selectedCiclo"
    v-model:uploaded-file="uploadedFile"
    :phase="phase"
    :results="results"
    :can-download-template="!!selectedCiclo"
    require-ciclo
    @download-template="downloadTemplate"
    @download-error-report="downloadErrorReport"
    @cancel="emit('cancel')"
    @finish="handleFinish"
  />
</template>
