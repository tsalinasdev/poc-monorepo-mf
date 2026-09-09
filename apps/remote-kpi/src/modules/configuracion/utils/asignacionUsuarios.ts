import { USUARIOS_SEED, type Usuario } from '@api/configuracion/usuarios/get_usuarios.php.ts'
import type { Asignacion } from '@api/configuracion/asignaciones/types'

// Usuarios que pertenecen al grupo de la asignación según su tipoAsignacion
// (area/nivelCargo/persona). Usado para listar filas de tabla (useAsignaciones,
// resultadosService, useAsignacionDetalle) — no confundir con el scope de
// resolución de roles de asignacionesService, que es intencionalmente más
// amplio para el caso 'persona'.
export function resolveGroupUsers(asignacion: Asignacion): Usuario[] {
  if (asignacion.tipoAsignacion === 'area') {
    return USUARIOS_SEED.filter((u) => asignacion.area.includes(u.areaId))
  }
  if (asignacion.tipoAsignacion === 'nivelCargo') {
    return USUARIOS_SEED.filter((u) => asignacion.cargo.includes(u.cargoId))
  }
  return asignacion.persona
    .map((id) => USUARIOS_SEED.find((u) => u.id === id))
    .filter((u): u is Usuario => u !== undefined)
}

type ResponsableField = 'cargaMetas' | 'validaMetas' | 'cargaResultados' | 'validaResultados'

/**
 * Nombre(s) del/los responsable(s) de un campo de rol (cargaMetas/etc.)
 * para un usuario dado: usa el override individual si existe, si no el valor
 * compartido del área/cargo. El resultado se limita a candidatos del mismo
 * scope que el usuario — el líder del área 1 no es responsable de la gente
 * del área 2.
 */
export function resolveResponsableName(
  asignacion: Asignacion,
  u: Usuario,
  field: ResponsableField,
): string {
  const override = asignacion.responsablesOverrides?.[u.id]
  const effectiveIds =
    override && override[field] !== undefined ? override[field] : asignacion[field]
  if (!Array.isArray(effectiveIds) || effectiveIds.length === 0) return 'Ninguno'

  const sameScope = (candidate: Usuario) => {
    if (asignacion.tipoAsignacion === 'area') return candidate.areaId === u.areaId
    if (asignacion.tipoAsignacion === 'nivelCargo') return candidate.cargoId === u.cargoId
    return true
  }

  const scoped = effectiveIds
    .map((id) => USUARIOS_SEED.find((x) => x.id === id))
    .filter((c): c is Usuario => c !== undefined && sameScope(c))
  if (scoped.length === 0) return 'Sin responsable'
  return scoped.map((c) => `${c.nombre} ${c.apellido}`).join(', ')
}
