// Los FormDrawer generan grupos repetibles (niveles, rangos, variables) como
// campos planos indexados: `${prefix}_${field}_${i}`. Estas funciones los
// reconstruyen en arrays de objetos al armar el payload de guardado.

type Payload = Record<string, unknown>

interface ExpandOptions {
  countKey?: string
}

function resolveIds(
  payload: Payload,
  prefix: string,
  anchorField: string,
  countKey: string | undefined,
): number[] {
  if (countKey) {
    const count = Number(payload[countKey]) || 0
    return Array.from({ length: count }, (_, i) => i)
  }
  const idRegex = new RegExp(`^${prefix}_${anchorField}_(\\d+)$`)
  return [
    ...new Set(
      Object.keys(payload)
        .map((k) => k.match(idRegex))
        .filter((m): m is RegExpMatchArray => m !== null)
        .map((m) => parseInt(m[1]!, 10)),
    ),
  ].sort((a, b) => a - b)
}

/**
 * `fieldsWithDefaults` define el orden de las columnas; el orden define cuál
 * subcampo se usa como ancla para inferir ids cuando no hay `countKey`.
 */
export function expandIndexedFields(
  payload: Payload,
  prefix: string,
  fieldsWithDefaults: Record<string, unknown>,
  { countKey }: ExpandOptions = {},
): Record<string, unknown>[] {
  const fieldNames = Object.keys(fieldsWithDefaults)
  const ids = resolveIds(payload, prefix, fieldNames[0]!, countKey)

  return ids.map((i) =>
    Object.fromEntries(
      fieldNames.map((field) => [
        field,
        payload[`${prefix}_${field}_${i}`] ?? fieldsWithDefaults[field],
      ]),
    ),
  )
}

export function omitKeysWithPrefix(payload: Payload, prefixes: string[]): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(([k]) => !prefixes.some((p) => k.startsWith(p))),
  )
}
