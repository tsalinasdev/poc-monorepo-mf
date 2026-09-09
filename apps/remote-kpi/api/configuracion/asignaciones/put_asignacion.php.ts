// PUT /api/configuracion/asignaciones/put_asignacion.php
// Param requerido: id (int)
// Body: Partial<Omit<Asignacion, 'id'>>
// Tabla: gkpis_asignaciones (UPDATE WHERE id)
//
// TODO (futuro Claude): reemplazar con fetch real al backend PHP.
//   Firma a mantener: (id: number, body: Partial<Omit<Asignacion, 'id'>>) => Promise<PutAsignacionResponse>

import type { Asignacion } from './types'
import { loadAsignaciones, saveAsignaciones } from './get_asignaciones.php'

export type PutAsignacionBody = Partial<Omit<Asignacion, 'id'>>

export interface PutAsignacionResponse {
  mensaje: string
}

export async function put(id: number, body: PutAsignacionBody): Promise<PutAsignacionResponse> {
  const asignaciones = loadAsignaciones()
  const idx = asignaciones.findIndex((a) => a.id === id)
  // noUncheckedIndexedAccess: indexar el array devuelve T | undefined.
  const existing = asignaciones[idx]
  if (!existing) throw new Error('Asignación no encontrada')
  asignaciones[idx] = { ...existing, ...body }
  saveAsignaciones(asignaciones)
  return { mensaje: 'Asignación editada exitosamente' }
}
