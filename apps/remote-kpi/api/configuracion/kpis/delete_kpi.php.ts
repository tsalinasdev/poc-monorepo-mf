// DELETE /api/configuracion/kpis/delete_kpi.php
// Param requerido: id (int)
// Tabla: gkpis_kpis (DELETE WHERE id)

import { loadKpis, saveKpis } from './get_kpis.php'

export interface DeleteKpiResponse {
  mensaje: string
}

export async function del(id: number): Promise<DeleteKpiResponse> {
  saveKpis(loadKpis().filter((k) => k.id !== id))
  return { mensaje: 'KPI eliminado exitosamente' }
}
