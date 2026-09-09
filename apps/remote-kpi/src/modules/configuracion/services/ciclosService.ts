import { get } from '@api/configuracion/ciclos/get_ciclos.php.ts'
import { post, type PostCicloBody } from '@api/configuracion/ciclos/post_ciclo.php.ts'
import { put } from '@api/configuracion/ciclos/put_ciclo.php.ts'
import { del } from '@api/configuracion/ciclos/delete_ciclo.php.ts'
import type { Ciclo, NivelInterpretacion } from '@api/configuracion/ciclos/types'
import { expandIndexedFields, omitKeysWithPrefix } from '../utils/indexedPayload'

/**
 * Forma del drawer de ciclos: además de los campos del modelo, el form
 * añade `_nivelesCount` y campos indexados (`nivel_nombre_<i>`, `nivel_tope_<i>`)
 * que se reconstruyen en array de niveles al armar el payload.
 */
export type CicloFormValues = Omit<Ciclo, 'nivelesInterpretacion' | 'niveles'> & {
  _nivelesCount?: number | string
  [k: `nivel_nombre_${number}`]: string
  [k: `nivel_tope_${number}`]: number | string | null
}

export function cicloToFormValues(ciclo: Ciclo): CicloFormValues {
  const vals: CicloFormValues = { ...ciclo } as CicloFormValues
  delete (vals as Partial<Ciclo>).id
  delete (vals as Partial<Ciclo>).nivelesInterpretacion
  delete (vals as Partial<Ciclo>).niveles
  vals._nivelesCount = ciclo.nivelesInterpretacion
  ciclo.niveles.forEach((n, i) => {
    vals[`nivel_nombre_${i}`] = n.nombre
    vals[`nivel_tope_${i}`] = n.tope
  })
  return vals
}

function mapPayload(payload: Record<string, unknown>): Omit<Ciclo, 'id'> {
  const niveles = expandIndexedFields(
    payload,
    'nivel',
    { nombre: '', tope: null } as Record<string, unknown>,
    { countKey: '_nivelesCount' },
  ) as unknown as NivelInterpretacion[]
  const base = omitKeysWithPrefix(payload, ['_nivelesCount', 'nivel_'])
  return { ...base, nivelesInterpretacion: niveles.length, niveles } as unknown as Omit<Ciclo, 'id'>
}

export default {
  getAll: (): Promise<Ciclo[]> => get(),
  create: (payload: CicloFormValues) =>
    post(mapPayload(payload as Record<string, unknown>) as PostCicloBody),
  update: (id: number, data: CicloFormValues) =>
    put(id, mapPayload(data as Record<string, unknown>)),
  remove: (id: number) => del(id),
}
