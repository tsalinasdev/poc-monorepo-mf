/**
 * Reparte 100% en partes iguales entre `count` KPIs; el resto de la
 * división entera se asigna a los primeros elementos para que la suma
 * sea siempre exactamente 100 (ej: 3 KPIs -> [34, 33, 33]).
 */
export function equalPonderaciones(count: number): number[] {
  if (!count || count < 1) return []
  const base = Math.floor(100 / count)
  const remainder = 100 - base * count
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0))
}
