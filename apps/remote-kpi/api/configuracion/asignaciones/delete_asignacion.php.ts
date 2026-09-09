// DELETE /api/configuracion/asignaciones/delete_asignacion.php
// Param requerido: id (int)
// Tabla: gkpis_asignaciones (DELETE WHERE id)
//
// TODO (futuro Claude): reemplazar con fetch real al backend PHP.
//   Firma a mantener: (id: number) => Promise<DeleteAsignacionResponse>

import { loadAsignaciones, saveAsignaciones } from './get_asignaciones.php'
import { USUARIOS_SEED } from '../usuarios/get_usuarios.php'
import type { Asignacion } from './types'

export interface DeleteAsignacionResponse {
  mensaje: string
}

function groupUserIds(a: Asignacion): number[] {
  if (a.tipoAsignacion === 'area') {
    return USUARIOS_SEED.filter((u) => a.area.includes(u.areaId)).map((u) => u.id)
  }
  if (a.tipoAsignacion === 'nivelCargo') {
    return USUARIOS_SEED.filter((u) => a.cargo.includes(u.cargoId)).map((u) => u.id)
  }
  return a.persona
}

// Quita un miembro de una asignación (fila de la tabla). Si era el último
// miembro restante del grupo, elimina la asignación completa.
function removeMiembro(asignaciones: Asignacion[], id: number, userId: number): Asignacion[] {
  const asignacion = asignaciones.find((a) => a.id === id)
  if (!asignacion) return asignaciones

  const excluidos = [...new Set([...(asignacion.excluidos ?? []), userId])]
  const restantes = groupUserIds(asignacion).filter((uid) => !excluidos.includes(uid))

  if (restantes.length === 0) {
    return asignaciones.filter((a) => a.id !== id)
  }
  return asignaciones.map((a) => (a.id === id ? { ...a, excluidos } : a))
}

export async function del(id: number, userId?: number): Promise<DeleteAsignacionResponse> {
  const asignaciones = loadAsignaciones()
  saveAsignaciones(
    userId == null
      ? asignaciones.filter((a) => a.id !== id)
      : removeMiembro(asignaciones, id, userId),
  )
  return { mensaje: 'Asignación eliminada exitosamente' }
}

export interface MiembroRef {
  asignacionId: number
  userId: number
}

export async function delMany(miembros: MiembroRef[]): Promise<DeleteAsignacionResponse> {
  let asignaciones = loadAsignaciones()
  for (const { asignacionId, userId } of miembros) {
    asignaciones = removeMiembro(asignaciones, asignacionId, userId)
  }
  saveAsignaciones(asignaciones)
  const n = miembros.length
  return {
    mensaje: `${n} asignacion${n !== 1 ? 'es' : ''} eliminada${n !== 1 ? 's' : ''} exitosamente`,
  }
}
