// PUT /api/configuracion/ciclos/put_ciclo.php
// Param requerido: id (int)
// Body: Partial<Omit<Ciclo, 'id'>>
// Tabla: gkpis_ciclos (UPDATE WHERE id)
//
// TODO (futuro Claude): reemplazar put() con fetch real al backend PHP.
//   La firma debe mantenerse: (id: number, body: PutCicloBody) => Promise<PutCicloResponse>
//   Ejemplo de reemplazo:
//     export async function put(id: number, body: PutCicloBody): Promise<PutCicloResponse> {
//       const res = await fetch(`/api/configuracion/ciclos/put_ciclo.php?id=${id}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(body),
//       })
//       return res.json()
//     }
//   El backend PHP deberá hacer UPDATE en gkpis_ciclos y reemplazar los niveles
//   en gkpis_ciclos_niveles (DELETE WHERE ciclo_id + INSERT nuevos).

import type { Ciclo } from './types'
import { loadCiclos, saveCiclos } from './get_ciclos.php'

export type PutCicloBody = Partial<Omit<Ciclo, 'id'>>

export interface PutCicloResponse {
  mensaje: string
}

export async function put(id: number, body: PutCicloBody): Promise<PutCicloResponse> {
  // TODO (futuro Claude): reemplazar con fetch al endpoint PHP real (ver comentario arriba)
  const ciclos = loadCiclos()
  const idx = ciclos.findIndex((c) => c.id === id)
  // noUncheckedIndexedAccess: indexar el array devuelve T | undefined.
  const existing = ciclos[idx]
  if (!existing) throw new Error('Ciclo no encontrado')
  ciclos[idx] = { ...existing, ...body }
  saveCiclos(ciclos)
  return { mensaje: 'Ciclo KPI editado exitosamente' }
}
