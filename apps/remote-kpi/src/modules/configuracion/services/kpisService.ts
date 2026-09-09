import { get } from '@api/configuracion/kpis/get_kpis.php.ts'
import { post, type PostKpiBody } from '@api/configuracion/kpis/post_kpi.php.ts'
import { put } from '@api/configuracion/kpis/put_kpi.php.ts'
import { del } from '@api/configuracion/kpis/delete_kpi.php.ts'
import type { Kpi, Rango, Variable } from '@api/configuracion/kpis/types'
import { expandIndexedFields, omitKeysWithPrefix } from '../utils/indexedPayload'

/**
 * Forma del drawer de KPIs: a `Kpi` se le quitan los arrays desnormalizados
 * (rangos/variables) y en su lugar se agregan los `_count` y los campos
 * indexados (`rango_minimo_<i>`, `variable_nombre_<i>`, etc.) que el form
 * manipula individualmente. La conversión de vuelta a payload vive en
 * `mapPayload` (el reverso de `kpiToFormValues`).
 */
export type KpiFormValues = Omit<Kpi, 'rangosCount' | 'rangos' | 'variablesCount' | 'variables'> & {
  _rangosCount?: number | string
  _variablesCount?: number | string
  [k: `rango_minimo_${number}`]: number | string
  [k: `rango_maximo_${number}`]: number | string
  [k: `rango_resultado_${number}`]: number | string
  [k: `variable_nombre_${number}`]: string
  [k: `variable_valor_prueba_${number}`]: number | string
}

export function kpiToFormValues(kpi: Kpi): KpiFormValues {
  const vals: KpiFormValues = { ...kpi } as KpiFormValues
  delete (vals as Partial<Kpi>).id
  delete (vals as Partial<Kpi>).rangosCount
  delete (vals as Partial<Kpi>).rangos
  delete (vals as Partial<Kpi>).variablesCount
  delete (vals as Partial<Kpi>).variables

  vals._rangosCount = kpi.rangosCount ?? 2
  kpi.rangos?.forEach((r, i) => {
    vals[`rango_minimo_${i}`] = r.minimo
    vals[`rango_maximo_${i}`] = r.maximo
    vals[`rango_resultado_${i}`] = r.resultado
  })

  vals._variablesCount = kpi.variablesCount ?? 2
  kpi.variables?.forEach((v, i) => {
    vals[`variable_nombre_${i}`] = v.nombre
    vals[`variable_valor_prueba_${i}`] = v.valorPrueba
  })

  return vals
}

function mapPayload(payload: Record<string, unknown>): PostKpiBody {
  const rangos = expandIndexedFields(
    payload,
    'rango',
    { minimo: 0, maximo: 0, resultado: 0 } as Record<string, unknown>,
    { countKey: '_rangosCount' },
  ) as unknown as Rango[]

  // La key del payload es `valor_prueba` (nombre del campo del form), pero el
  // modelo de dominio usa `valorPrueba` — se renombra tras expandir.
  const variables = expandIndexedFields(payload, 'variable', {
    nombre: '',
    valor_prueba: 0,
  } as Record<string, unknown>).map((row) => {
    const item = row as unknown as { nombre: unknown; valor_prueba: unknown }
    return {
      nombre: String(item.nombre),
      valorPrueba: Number(item.valor_prueba),
    }
  }) as unknown as Variable[]

  const base = omitKeysWithPrefix(payload, [
    '_rangosCount',
    '_add_',
    '_var_group_',
    'rango_',
    'variable_',
  ])

  return {
    ...base,
    rangosCount: rangos.length,
    rangos,
    variablesCount: variables.length,
    variables,
  } as unknown as PostKpiBody
}

export default {
  getAll: (): Promise<Kpi[]> => get(),
  create: (payload: KpiFormValues) => post(mapPayload(payload as Record<string, unknown>)),
  update: (id: number, data: KpiFormValues) => put(id, mapPayload(data as Record<string, unknown>)),
  remove: (id: number) => del(id),
  disassociate: (id: number) => put(id, { kpiPadre: null, kpiHijos: [] } as unknown as PostKpiBody),
  associate: (id: number, padreId: number) =>
    put(id, { kpiPadre: padreId } as unknown as PostKpiBody),
}
