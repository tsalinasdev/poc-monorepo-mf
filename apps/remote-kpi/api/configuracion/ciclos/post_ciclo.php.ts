// POST /api/configuracion/ciclos/post_ciclo.php
// Body: Omit<Ciclo, 'id'>
// Tabla: gkpis_ciclos (INSERT)
//
// TODO (futuro Claude): reemplazar post() con fetch real al backend PHP.
//   La firma debe mantenerse: (body: PostCicloBody) => Promise<PostCicloResponse>
//   Ejemplo de reemplazo:
//     export async function post(body: PostCicloBody): Promise<PostCicloResponse> {
//       const res = await fetch('/api/configuracion/ciclos/post_ciclo.php', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(body),
//       })
//       return res.json()
//     }
//   El backend PHP deberá insertar en gkpis_ciclos y los niveles en gkpis_ciclos_niveles.
//   Devuelve el id generado por la BD (no Date.now()).

import type { Ciclo } from './types'
import { loadCiclos, saveCiclos } from './get_ciclos.php'

export type PostCicloBody = Omit<Ciclo, 'id'>

export interface PostCicloResponse {
  id: number
  mensaje: string
}

export async function post(body: PostCicloBody): Promise<PostCicloResponse> {
  // TODO (futuro Claude): reemplazar con fetch al endpoint PHP real (ver comentario arriba)
  const ciclos = loadCiclos()
  const id = Date.now()
  ciclos.push({ id, ...body })
  saveCiclos(ciclos)
  return { id, mensaje: 'Ciclo creado exitosamente' }
}
