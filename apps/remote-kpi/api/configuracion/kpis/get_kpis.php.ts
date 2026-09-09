// GET /api/configuracion/kpis/get_kpis.php
// Param requerido: empresas_id (int)
// Tabla: gkpis_kpis
//
// TODO (futuro Claude): reemplazar con fetch real al backend PHP.
//   Firma a mantener: () => Promise<Kpi[]>

export type { Kpi } from './types'
import type { Kpi } from './types'

const STORAGE_KEY = 'kpi_kpis'

export function loadKpis(): Kpi[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveKpis(kpis: Kpi[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kpis))
}

export async function get(): Promise<Kpi[]> {
  return loadKpis()
}
