export type PeriodoMedicion =
  | 'anual'
  | 'semestral'
  | 'cuatrimestral'
  | 'trimestral'
  | 'bimestral'
  | 'mensual'
  | 'quincenal'
  | 'semanal'
  | 'diario'
  | 'personalizado'

export const PERIODO_LABELS: Record<PeriodoMedicion | string, string> = {
  anual: 'Anual',
  semestral: 'Semestral',
  cuatrimestral: 'Cuatrimestral',
  trimestral: 'Trimestral',
  bimestral: 'Bimestral',
  mensual: 'Mensual',
  quincenal: 'Quincenal',
  semanal: 'Semanal',
  diario: 'Diario',
  personalizado: 'Personalizado',
}

const PERIODO_COUNTS: Record<string, number> = {
  anual: 1,
  semestral: 2,
  cuatrimestral: 3,
  trimestral: 4,
  bimestral: 6,
  mensual: 12,
  quincenal: 24,
  semanal: 52,
}

export interface MedicionRow {
  id: number
  label: string
  fechaInicio: string
  fechaFin: string
  meta: number | string
  resultado: number | null
  estado: 'por_cargar' | 'cargado' | string
}

/**
 * Genera las mediciones de un ciclo. `metaDefault` es el % de cumplimiento
 * sugerido (viene del ciclo, lo ajusta el usuario por medición si quiere).
 */
export function generateMediciones(
  periodoMedicion: string,
  numMediciones: number | null,
  metaDefault: number | null = null,
): MedicionRow[] {
  const count =
    periodoMedicion === 'personalizado'
      ? (numMediciones ?? 1)
      : (PERIODO_COUNTS[periodoMedicion] ?? 1)
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    label: `${PERIODO_LABELS[periodoMedicion] ?? periodoMedicion} ${i + 1}`,
    fechaInicio: '',
    fechaFin: '',
    meta: metaDefault ?? '',
    resultado: null,
    estado: 'por_cargar',
  }))
}
