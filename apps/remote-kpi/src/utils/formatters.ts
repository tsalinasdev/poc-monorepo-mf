/**
 * Formateadores de celdas. Aceptan `Date | string | number | null` para
 * cubrir lo que devuelve la API según el tipo de columna: fechas como ISO
 * strings, números como enteros, porcentajes como decimales.
 */

type DateLike = Date | string | number | null

export function formatDate(value: DateLike): string {
  if (!value) return ''
  return new Date(value).toLocaleDateString('es-CL')
}

export function formatNumber(value: number | string | null, decimals = 2): string {
  if (value == null) return ''
  return Number(value).toFixed(decimals)
}

export function formatPercent(value: number | string | null): string {
  if (value == null) return ''
  return `${Number(value).toFixed(1)}%`
}
