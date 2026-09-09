import { get } from '@api/configuracion/asignaciones/get_asignaciones.php.ts'
import {
  post,
  type PostAsignacionBody,
} from '@api/configuracion/asignaciones/post_asignacion.php.ts'
import { put, type PutAsignacionBody } from '@api/configuracion/asignaciones/put_asignacion.php.ts'
import {
  del,
  delMany,
  type MiembroRef,
} from '@api/configuracion/asignaciones/delete_asignacion.php.ts'
import type { Asignacion, Responsables } from '@api/configuracion/asignaciones/types'
import { USUARIOS_SEED, type Usuario } from '@api/configuracion/usuarios/get_usuarios.php.ts'

const ROLES_METAS_RESULTADOS = ['ninguno', 'lider', 'liderLider', 'trabajador'] as const
type Rol = (typeof ROLES_METAS_RESULTADOS)[number]
type ResponsableField = keyof Responsables

export function asignacionToFormValues(asignacion: Asignacion): {
  tipoAsignacion: Asignacion['tipoAsignacion']
  area: number[]
  cargo: number[]
  persona: number[]
  kpi: number[]
  periodoMedicion: Asignacion['periodoMedicion']
  numMediciones: Asignacion['numMediciones']
} {
  return {
    tipoAsignacion: asignacion.tipoAsignacion,
    area: asignacion.area ?? [],
    cargo: asignacion.cargo ?? [],
    persona: asignacion.persona ?? [],
    kpi: asignacion.kpi ?? [],
    periodoMedicion: asignacion.periodoMedicion,
    numMediciones: asignacion.numMediciones,
  }
}

// Resuelve el rol ('lider'|'liderLider'|'trabajador'|'ninguno') a los IDs de los
// usuarios del grupo cuyo rolKpi coincide.
function resolveRolToIds(groupUsers: Usuario[], rol: Rol | '' | undefined): number[] {
  if (rol === 'ninguno' || !rol) return []
  return groupUsers.filter((u) => u.rolKpi === rol).map((u) => u.id)
}

// Inverso de resolveRolToIds: dado un set de ids ya resueltos, encuentra el rol
// que los generó (para precargar el drawer de edición de responsables).
function resolveRolFromIds(groupUsers: Usuario[], ids: number[] | undefined): Rol {
  const idSet = new Set(ids ?? [])
  for (const rol of ROLES_METAS_RESULTADOS) {
    const expected = resolveRolToIds(groupUsers, rol)
    if (expected.length === idSet.size && expected.every((id) => idSet.has(id))) return rol
  }
  return 'ninguno'
}

function resolveGroupUsers(
  asignacion:
    | Asignacion
    | {
        tipoAsignacion: Asignacion['tipoAsignacion']
        area: number[]
        cargo: number[]
        persona: number[]
      },
): Usuario[] {
  if (asignacion.tipoAsignacion === 'area') {
    return USUARIOS_SEED.filter((u) => (asignacion.area as number[]).includes(u.areaId))
  }
  if (asignacion.tipoAsignacion === 'nivelCargo') {
    return USUARIOS_SEED.filter((u) => (asignacion.cargo as number[]).includes(u.cargoId))
  }
  // 'persona': el scope de resolución de roles (líder/trabajador/etc) es el
  // área de cada persona seleccionada, no la lista de personas en sí — si no,
  // "responsable: líder" solo resolvería cuando la persona asignada fuese
  // ella misma líder, lo que no tiene sentido (el responsable debe ser otra
  // persona, ej. su jefe).
  const areaIds = new Set(
    (asignacion.persona as number[])
      .map((id) => USUARIOS_SEED.find((u) => u.id === id)?.areaId)
      .filter((id): id is number => id !== undefined),
  )
  return USUARIOS_SEED.filter((u) => areaIds.has(u.areaId))
}

// El responsable se edita por área/cargo de la fila abierta, no por todo el
// grupo multi-área de la asignación (mismo scoping que useAsignaciones
// aplica para mostrar el responsable de cada fila).
function resolveEditScope(asignacion: Asignacion, userId: number): Usuario[] {
  const target = USUARIOS_SEED.find((u) => u.id === userId)
  if (!target) return resolveGroupUsers(asignacion)
  if (asignacion.tipoAsignacion === 'area')
    return USUARIOS_SEED.filter((u) => u.areaId === target.areaId)
  if (asignacion.tipoAsignacion === 'nivelCargo')
    return USUARIOS_SEED.filter((u) => u.cargoId === target.cargoId)
  return USUARIOS_SEED.filter((u) => u.areaId === target.areaId)
}

function mapPayload(cicloId: number, payload: Record<string, unknown>): PostAsignacionBody {
  const area = Array.isArray(payload.area) ? (payload.area as number[]) : []
  const cargo = Array.isArray(payload.cargo) ? (payload.cargo as number[]) : []
  const persona = Array.isArray(payload.persona) ? (payload.persona as number[]) : []

  const groupUsers = resolveGroupUsers({
    tipoAsignacion: payload.tipoAsignacion as Asignacion['tipoAsignacion'],
    area,
    cargo,
    persona,
  })

  return {
    cicloId,
    tipoAsignacion: payload.tipoAsignacion as Asignacion['tipoAsignacion'],
    area,
    cargo,
    persona,
    kpi: Array.isArray(payload.kpi) ? (payload.kpi as number[]) : [],
    periodoMedicion: (payload.periodoMedicion ?? null) as Asignacion['periodoMedicion'],
    numMediciones: (payload.numMediciones ?? null) as Asignacion['numMediciones'],
    cargaMetas: resolveRolToIds(groupUsers, payload.cargaMetas as Rol),
    validaMetas: resolveRolToIds(groupUsers, payload.validaMetas as Rol),
    cargaResultados: resolveRolToIds(groupUsers, payload.cargaResultados as Rol),
    validaResultados: resolveRolToIds(groupUsers, payload.validaResultados as Rol),
  } as PostAsignacionBody
}

// Valor "efectivo" de un campo de responsable para una persona: su override
// individual si existe, si no el valor compartido del área/cargo (default).
function effectiveField(asignacion: Asignacion, userId: number, field: ResponsableField): number[] {
  const override = asignacion.responsablesOverrides?.[userId]
  return (
    override && override[field] !== undefined ? override[field] : asignacion[field]
  ) as number[]
}

export interface ResponsablesFormValues {
  cargaMetas: Rol
  validaMetas: Rol
  cargaResultados: Rol
  validaResultados: Rol
}

export function responsablesToFormValues(
  asignacion: Asignacion,
  userId: number,
): ResponsablesFormValues {
  const scopeUsers = resolveEditScope(asignacion, userId)
  const scopeIds = new Set(scopeUsers.map((u) => u.id))
  const inScope = (ids: number[] | undefined) => (ids ?? []).filter((id) => scopeIds.has(id))
  return {
    cargaMetas: resolveRolFromIds(
      scopeUsers,
      inScope(effectiveField(asignacion, userId, 'cargaMetas')),
    ),
    validaMetas: resolveRolFromIds(
      scopeUsers,
      inScope(effectiveField(asignacion, userId, 'validaMetas')),
    ),
    cargaResultados: resolveRolFromIds(
      scopeUsers,
      inScope(effectiveField(asignacion, userId, 'cargaResultados')),
    ),
    validaResultados: resolveRolFromIds(
      scopeUsers,
      inScope(effectiveField(asignacion, userId, 'validaResultados')),
    ),
  }
}

// Override individual: el rol elegido se resuelve contra el área/cargo de la
// persona (para encontrar, ej., a su líder), pero el resultado se guarda solo
// para esa persona — no se comparte con el resto de su área/cargo.
function overrideForUser(
  asignacion: Asignacion,
  userId: number,
  payload: Record<string, unknown>,
): Responsables {
  const scopeUsers = resolveEditScope(asignacion, userId)
  return {
    cargaMetas: resolveRolToIds(scopeUsers, payload.cargaMetas as Rol),
    validaMetas: resolveRolToIds(scopeUsers, payload.validaMetas as Rol),
    cargaResultados: resolveRolToIds(scopeUsers, payload.cargaResultados as Rol),
    validaResultados: resolveRolToIds(scopeUsers, payload.validaResultados as Rol),
  }
}

function mapResponsablesPayload(
  asignacion: Asignacion,
  userId: number,
  payload: Record<string, unknown>,
): PutAsignacionBody {
  return {
    responsablesOverrides: {
      ...asignacion.responsablesOverrides,
      [userId]: overrideForUser(asignacion, userId, payload),
    },
  }
}

// Edición masiva: mismo rol aplicado a varias personas de una misma
// asignación, cada una resuelta y guardada como override individual propio.
function mapBulkResponsablesPayload(
  asignacion: Asignacion,
  userIds: number[],
  payload: Record<string, unknown>,
): PutAsignacionBody {
  const overrides = { ...asignacion.responsablesOverrides }
  for (const userId of userIds) {
    overrides[userId] = overrideForUser(asignacion, userId, payload)
  }
  return { responsablesOverrides: overrides }
}

export default {
  getAll: (cicloId: number) => get(cicloId),
  create: (cicloId: number, data: Record<string, unknown>) => post(mapPayload(cicloId, data)),
  updateResponsables: (asignacion: Asignacion, userId: number, payload: Record<string, unknown>) =>
    put(asignacion.id, mapResponsablesPayload(asignacion, userId, payload)),
  bulkUpdateResponsables: (
    asignacion: Asignacion,
    userIds: number[],
    payload: Record<string, unknown>,
  ) => put(asignacion.id, mapBulkResponsablesPayload(asignacion, userIds, payload)),
  updateDetalle: (id: number, payload: PutAsignacionBody) => put(id, payload),
  remove: (id: number, userId: number) => del(id, userId),
  bulkRemove: (miembros: MiembroRef[]) => delMany(miembros),
}
