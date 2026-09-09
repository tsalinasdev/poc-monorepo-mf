// PUT /api/configuracion/kpis/put_kpi.php
// Param requerido: id (int)
// Body: Partial<Omit<Kpi, 'id'>>
// Tabla: gkpis_kpis (UPDATE WHERE id)

import type { Kpi } from './types'
import { loadKpis, saveKpis } from './get_kpis.php'

export type PutKpiBody = Partial<Omit<Kpi, 'id'>>

export interface PutKpiResponse {
  mensaje: string
}

export async function put(id: number, body: PutKpiBody): Promise<PutKpiResponse> {
  const kpis = loadKpis()
  const idx = kpis.findIndex((k) => k.id === id)
  // noUncheckedIndexedAccess: indexar el array devuelve T | undefined.
  const existing = kpis[idx]
  if (!existing) throw new Error('KPI no encontrado')
  kpis[idx] = { ...existing, ...body }
  saveKpis(kpis)
  return { mensaje: 'KPI editado exitosamente' }
}
