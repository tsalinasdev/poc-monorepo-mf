// POST /api/configuracion/asignaciones/post_asignacion.php
// Body: Omit<Asignacion, 'id'>
// Tabla: gkpis_asignaciones (INSERT)
//
// TODO (futuro Claude): reemplazar con fetch real al backend PHP.
//   Firma a mantener: (body: Omit<Asignacion, 'id'>) => Promise<PostAsignacionResponse>

import type { Asignacion } from './types'
import { loadAsignaciones, saveAsignaciones } from './get_asignaciones.php'

export type PostAsignacionBody = Omit<Asignacion, 'id'>

export interface PostAsignacionResponse {
  id: number
  mensaje: string
}

export async function post(body: PostAsignacionBody): Promise<PostAsignacionResponse> {
  const asignaciones = loadAsignaciones()
  const id = Date.now()
  asignaciones.push({ id, ...body })
  saveAsignaciones(asignaciones)
  return { id, mensaje: 'Asignación creada exitosamente' }
}
