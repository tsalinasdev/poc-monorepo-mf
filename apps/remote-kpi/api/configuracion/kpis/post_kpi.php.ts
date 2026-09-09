// POST /api/configuracion/kpis/post_kpi.php
// Body: Omit<Kpi, 'id'>
// Tabla: gkpis_kpis (INSERT)

import type { Kpi } from './types'
import { loadKpis, saveKpis } from './get_kpis.php'

export type PostKpiBody = Omit<Kpi, 'id'>

export interface PostKpiResponse {
  id: number
  mensaje: string
}

export async function post(body: PostKpiBody): Promise<PostKpiResponse> {
  const kpis = loadKpis()
  const id = Date.now()
  kpis.push({ id, ...body })
  saveKpis(kpis)
  return { id, mensaje: 'KPI creado exitosamente' }
}
