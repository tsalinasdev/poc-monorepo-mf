export interface MedicionRow {
  id: number
  label: string
  fechaInicio: string
  fechaFin: string
  meta: string
  resultado: number | null
  estado: 'validado' | 'por_validar' | 'por_cargar'
}

export interface Responsables {
  cargaMetas: number[]
  validaMetas: number[]
  cargaResultados: number[]
  validaResultados: number[]
}

export interface Asignacion extends Responsables {
  id: number
  cicloId: number
  tipoAsignacion: 'area' | 'nivelCargo' | 'persona'
  area: number[]
  cargo: number[]
  persona: number[]
  kpi: number[]
  periodoMedicion: string
  numMediciones: number | null
  excluidos?: number[]
  // Override individual por persona (userId) — cuando existe para un campo,
  // reemplaza al responsable compartido del área/cargo solo para esa fila.
  responsablesOverrides?: Record<number, Responsables>
  kpiPonderaciones?: Record<number, number>
  kpiMediciones?: Record<number, MedicionRow[]>
}
