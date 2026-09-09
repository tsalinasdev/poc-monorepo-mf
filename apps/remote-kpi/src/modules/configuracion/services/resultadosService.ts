import {
  loadAsignaciones,
  saveAsignaciones,
} from '@api/configuracion/asignaciones/get_asignaciones.php.ts'
import type { Asignacion, MedicionRow } from '@api/configuracion/asignaciones/types'
import kpisService from './kpisService'
import { generateMediciones } from '../utils/mediciones'
import { resolveGroupUsers } from '../utils/asignacionUsuarios'

// Resultados no tiene tabla propia: es una proyección de gkpis_asignaciones.kpiMediciones.
// Única fuente de verdad = storage de asignaciones (mismo que consume AsignacionDetalleView).

type EstadoResultado = 'por_definir' | 'por_cargar' | 'por_validar' | 'validado'

export interface ResultadoRow {
  id: string
  asignacionId: number
  userId: number
  kpiId: number
  medicionId: number
  persona: string
  personaRut: string
  kpiNombre: string
  descripcion: string
  tipoCalculo: string
  periodoLabel: string
  meta: number | string
  resultado: number | null
  estado: EstadoResultado
  cumplimiento: number
}

export interface ResultadoEdit {
  asignacionId: number
  userId: number
  kpiId: number
  medicionId: number
  resultado: number | null
}

export interface ResultadoBulkItem {
  asignacionId: number
  userId: number
  kpiId: number
  medicionId: number
}

interface ApiResponse {
  mensaje: string
}

function resolveEstado(medicion: MedicionRow): EstadoResultado {
  if (!medicion.meta) return 'por_definir'
  if (medicion.resultado === null || medicion.resultado === undefined) return 'por_cargar'
  return medicion.estado === 'validado' ? 'validado' : 'por_validar'
}

function calcCumplimiento(meta: number | string, resultado: number | null | undefined): number {
  const metaNum = Number(meta) || 0
  if (metaNum <= 0) return 0
  return Math.round(((Number(resultado) || 0) / metaNum) * 100)
}

export async function getAll(cicloId: number): Promise<ResultadoRow[]> {
  const asignaciones: Asignacion[] = loadAsignaciones().filter((a) => a.cicloId === cicloId)
  const kpis = await kpisService.getAll()

  return asignaciones.flatMap((asignacion) =>
    resolveGroupUsers(asignacion).flatMap((usuario) =>
      asignacion.kpi.flatMap((kpiId) => {
        const kpi = kpis.find((k) => k.id === kpiId)
        if (!kpi) return []
        // kpiMediciones vive por persona (mismo criterio que useAsignacionDetalle) —
        // no se comparte entre las personas de una misma asignación grupal.
        const userMed: Record<number, MedicionRow[]> =
          (asignacion.kpiMediciones?.[usuario.id] as Record<number, MedicionRow[]> | undefined) ??
          {}
        const mediciones: MedicionRow[] =
          userMed[kpiId] ?? generateMediciones(asignacion.periodoMedicion, asignacion.numMediciones)
        return mediciones.map((medicion) => ({
          id: `${asignacion.id}_${usuario.id}_${kpiId}_${medicion.id}`,
          asignacionId: asignacion.id,
          userId: usuario.id,
          kpiId,
          medicionId: medicion.id,
          persona: `${usuario.nombre} ${usuario.apellido}`,
          personaRut: usuario.rut,
          kpiNombre: kpi.nombreKpi,
          descripcion: kpi.descripcionKpi ?? '',
          tipoCalculo: kpi.tipoCalculo,
          periodoLabel: medicion.label,
          meta: medicion.meta,
          resultado: medicion.resultado ?? null,
          estado: resolveEstado(medicion),
          cumplimiento: calcCumplimiento(medicion.meta, medicion.resultado),
        }))
      }),
    ),
  )
}

function mutateMedicion(
  asignacionId: number,
  userId: number,
  kpiId: number,
  medicionId: number,
  mutate: (m: MedicionRow) => MedicionRow,
): void {
  const asignaciones = loadAsignaciones()
  const idx = asignaciones.findIndex((a) => a.id === asignacionId)
  if (idx === -1) return

  const userMediciones: Record<number, MedicionRow[]> =
    (asignaciones[idx]!.kpiMediciones?.[userId] as Record<number, MedicionRow[]> | undefined) ?? {}
  const mediciones: MedicionRow[] =
    userMediciones[kpiId] ??
    generateMediciones(asignaciones[idx]!.periodoMedicion, asignaciones[idx]!.numMediciones)
  const mIdx = mediciones.findIndex((m: MedicionRow) => m.id === medicionId)
  if (mIdx === -1) return

  const updated = [...mediciones]
  updated[mIdx] = mutate({ ...updated[mIdx]! })

  const existingKpiMediciones: Record<number, MedicionRow[]> = (asignaciones[idx]!.kpiMediciones ??
    {}) as Record<number, MedicionRow[]>
  const userSlot: Record<number, MedicionRow[]> = { ...userMediciones, [kpiId]: updated }
  const merged: Record<number, MedicionRow[]> = {
    ...existingKpiMediciones,
    [userId]: userSlot,
  } as Record<number, MedicionRow[]>
  const newKpiMediciones: Record<number, MedicionRow[]> = merged
  asignaciones[idx] = {
    ...asignaciones[idx]!,
    kpiMediciones: newKpiMediciones,
  }
  saveAsignaciones(asignaciones)
}

export async function saveResultados(edits: ResultadoEdit[]): Promise<ApiResponse> {
  edits.forEach(({ asignacionId, userId, kpiId, medicionId, resultado }) => {
    mutateMedicion(asignacionId, userId, kpiId, medicionId, (m) => ({
      ...m,
      resultado,
      estado: m.estado === 'validado' ? 'validado' : 'por_validar',
    }))
  })
  return { mensaje: 'Resultados guardados con éxito' }
}

export async function resetResultado(
  asignacionId: number,
  userId: number,
  kpiId: number,
  medicionId: number,
): Promise<ApiResponse> {
  mutateMedicion(asignacionId, userId, kpiId, medicionId, (m) => ({
    ...m,
    resultado: null,
    estado: 'por_cargar',
  }))
  return { mensaje: 'Resultado reseteado con éxito' }
}

export async function validateResultado(
  asignacionId: number,
  userId: number,
  kpiId: number,
  medicionId: number,
): Promise<ApiResponse> {
  mutateMedicion(asignacionId, userId, kpiId, medicionId, (m) => ({ ...m, estado: 'validado' }))
  return { mensaje: 'Resultado validado con éxito' }
}

export async function validateMany(items: ResultadoBulkItem[]): Promise<ApiResponse> {
  items.forEach(({ asignacionId, userId, kpiId, medicionId }) => {
    mutateMedicion(asignacionId, userId, kpiId, medicionId, (m) => ({ ...m, estado: 'validado' }))
  })
  return { mensaje: 'Resultados validados con éxito' }
}

export default { getAll, saveResultados, resetResultado, validateResultado, validateMany }
