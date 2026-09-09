// DELETE /api/configuracion/ciclos/delete_ciclo.php
// Param requerido: id (int)
// Tabla: gkpis_ciclos (DELETE WHERE id, CASCADE a gkpis_kpis y gkpis_asignaciones)
//
// TODO (futuro Claude): reemplazar del() con fetch real al backend PHP.
//   La firma debe mantenerse: (id: number) => Promise<DeleteCicloResponse>
//   Ejemplo de reemplazo:
//     export async function del(id: number): Promise<DeleteCicloResponse> {
//       const res = await fetch(`/api/configuracion/ciclos/delete_ciclo.php?id=${id}`, {
//         method: 'DELETE',
//       })
//       return res.json()
//     }
//   El backend PHP deberá hacer DELETE en gkpis_ciclos con CASCADE (o borrado explícito previo)
//   sobre gkpis_kpis y gkpis_asignaciones del ciclo. Resultados no tiene tabla propia (ver
//   resultadosService.js), se limpia solo al desaparecer las asignaciones que los contienen.

import { loadCiclos, saveCiclos } from './get_ciclos.php'
import { loadKpis, saveKpis } from '../kpis/get_kpis.php'
import { loadAsignaciones, saveAsignaciones } from '../asignaciones/get_asignaciones.php'

export interface DeleteCicloResponse {
  mensaje: string
}

export async function del(id: number): Promise<DeleteCicloResponse> {
  // TODO (futuro Claude): reemplazar con fetch al endpoint PHP real (ver comentario arriba)
  const ciclo = loadCiclos().find((c) => c.id === id)

  if (ciclo) {
    // KPI.cicloKpi guarda el nombre del ciclo, no el id (ver KpisView.vue) — join por nombre.
    saveKpis(loadKpis().filter((k) => k.cicloKpi !== ciclo.nombre))
    saveAsignaciones(loadAsignaciones().filter((a) => a.cicloId !== id))
  }

  saveCiclos(loadCiclos().filter((c) => c.id !== id))
  return { mensaje: 'Ciclo eliminado exitosamente' }
}
