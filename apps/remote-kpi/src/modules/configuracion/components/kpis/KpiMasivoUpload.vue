<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)

import { ref, watch } from 'vue'
import MasivoUploadShell from '@/components/ui/MasivoUploadShell.vue'
import kpisService from '../../services/kpisService'
import { downloadCsv } from '@/utils/exportCsv'

const props = defineProps({
  ciclosOptions: { type: Array, default: () => [] },
  kpis:          { type: Array, default: () => [] },
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

// idle -> processing -> done. "done" es requisito para habilitar el botón
// final (no basta con haber seleccionado archivo, tiene que haberse
// procesado y arrojado un resultado).
const phase   = ref('idle')
const results = ref(null) // { total, ok, errors: [{ fila, motivo }] }

const EXPECTED_HEADER = ['Accion', 'ID', 'Nombre', 'Descripcion', 'UnidadDeMedida', 'EsPadre']

// Códigos del archivo de equivalencias (más opciones que las 5 del form unitario, a propósito).
const UNIDADES_EQUIVALENCIA = ['clp', 'clp_mill', 'usd', 'usd_mill', 'uf', 'porcentaje', 'unidades', 'dias', 'nota']
const ERROR_COLUMNS = [
  { key: 'fila',   name: 'N° de fila' },
  { key: 'motivo', name: 'Motivo de error' },
]

const TEMPLATE_CSV = [
  'Accion;ID;Nombre;Descripcion;UnidadDeMedida;EsPadre',
  '0: agregar 1: editar;160;Mi Primer KPI;La descripción (y el nombre) de mi kpi no debe tener punto y coma;el código de la unidad de medida está en el archivo de equivalencias;1 para si o 0 para no',
  '1;160;Mi Segundo KPI;Descripción de mi segundo KPI;clp;1',
  '0;;Mi Tercer KPI;Descripción de mi tercer KPI;usd;0',
].join('\n')

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'template_kpi.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function downloadErrorReport() {
  downloadCsv('reporte_errores_kpi.csv', ERROR_COLUMNS, results.value?.errors ?? [])
}

// Validación de formato (alcance frontend): estructura y tipos de dato.
// No valida reglas de negocio propias del backend real (duplicados server-
// side, permisos, etc.) — eso queda para cuando exista la API real.
function validateRow(cols) {
  const [accion, id, nombre, , unidad, esPadre] = cols
  if (!['0', '1'].includes(accion)) return 'Acción debe ser 0 (agregar) o 1 (editar)'
  if (accion === '1' && !id) return 'ID es requerido para editar'
  if (!nombre) return 'Nombre es requerido'
  if (nombre.length > 100) return 'Nombre excede 100 caracteres'
  if (unidad && !UNIDADES_EQUIVALENCIA.includes(unidad.toLowerCase())) return `Unidad de medida "${unidad}" no existe en el archivo de equivalencias`
  if (!['0', '1'].includes(esPadre)) return 'EsPadre debe ser 0 o 1'
  if (accion === '1' && !props.kpis.some((k) => String(k.id) === id)) return `No existe un KPI con ID ${id}`
  return null
}

function rowToPayload(cols) {
  const [, , nombre, descripcion, unidad, esPadre] = cols
  return {
    cicloKpi:        selectedCiclo.value,
    nombreKpi:       nombre,
    descripcionKpi:  descripcion || null,
    unidadMedida:    unidad || null,
    dependencia:     esPadre === '1' ? 'padre' : 'estandar',
    tipoCalculo:     'ponderado',
    estado:          'activo',
    kpiPadre:        null,
    kpiHijos:        [],
    rangosCount:     0,
    rangos:          [],
    variablesCount:  0,
    variables:       [],
    funcionFormula:  null,
    medicionMinima:  null,
    medicionMaxima:  null,
    resultadoMinimo: null,
    resultadoMaximo: null,
    tendencia:       null,
  }
}

async function processFile(file) {
  phase.value = 'processing'
  // Espera artificial para simular el procesamiento — reemplazar por el
  // estado real de la request cuando exista backend.
  await new Promise((resolve) => setTimeout(resolve, 400))

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
    const motivo = validateRow(cols)
    if (motivo) { errors.push({ fila, motivo }); continue }

    try {
      // TODO (futuro Claude): reemplazar por la llamada real de importación
      // masiva cuando exista backend — hoy persiste fila a fila contra el
      // mock de localStorage vía kpisService, igual que el resto de la app.
      const [accion, id] = cols
      if (accion === '1') await kpisService.update(Number(id), rowToPayload(cols))
      else await kpisService.create(rowToPayload(cols))
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
    title="Agregar KPI masivamente"
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
