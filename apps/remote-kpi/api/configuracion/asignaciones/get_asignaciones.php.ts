// GET /api/configuracion/asignaciones/get_asignaciones.php
// Params requeridos: empresas_id (int), ciclo_id (int)
// Tabla: gkpis_asignaciones
//
// TODO (futuro Claude): reemplazar con fetch real al backend PHP.
//   Firma a mantener: (cicloId: number) => Promise<Asignacion[]>

export type { Asignacion } from './types'
import type { Asignacion } from './types'

const STORAGE_KEY = 'kpi_asignaciones'

export function loadAsignaciones(): Asignacion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveAsignaciones(asignaciones: Asignacion[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(asignaciones))
}

export async function get(cicloId: number): Promise<Asignacion[]> {
  return loadAsignaciones().filter((a) => a.cicloId === cicloId)
}
