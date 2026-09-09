/**
 * Filtro de búsqueda repetido en varios composables: solo filtra a partir de
 * 3 caracteres (evita listas casi vacías por errores de tipeo de 1-2 letras).
 * `matches` expresa la comparación específica de cada entidad (qué campo(s)
 * mirar), este helper solo normaliza el término y aplica el corte de largo.
 */
export function filterBySearch<T>(
  items: T[],
  term: string,
  matches: (item: T, normalized: string) => boolean,
): T[] {
  const t = term.trim().toLowerCase()
  if (t.length < 3) return items
  return items.filter((item) => matches(item, t))
}
