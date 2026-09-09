/**
 * Exportador CSV de las tablas. La convención del proyecto es separador `;`
 * (no `,`) para que abra en una sola columna en Excel es-CL; comillas dobles
 * para escapar valores con `;`, `"` o saltos de línea.
 */

export interface CsvColumn<T = Record<string, unknown>> {
  key: keyof T & string
  name: string
  format?: (row: T) => string
}

function escapeCsvValue(value: unknown): string {
  const str = value == null ? '' : String(value)
  return /[";\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

export function downloadCsv<T = Record<string, unknown>>(
  filename: string,
  columns: CsvColumn<T>[],
  rows: T[],
): void {
  const header = columns.map((c) => escapeCsvValue(c.name)).join(';')
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvValue(c.format ? c.format(row) : row[c.key])).join(';'),
  )
  const csv = [header, ...lines].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
