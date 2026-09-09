export interface NivelInterpretacion {
  nombre: string
  tope: number | null
}

export interface Ciclo {
  id: number
  nombre: string
  cicloDesempeno: string
  tipoCiclo: 'centralizado' | 'top-down' | 'bottom-up'
  fechaInicio: string
  fechaFin: string
  fechaPlanificacion: string | null
  limiteCumplimiento: number | null
  limitePersona: number
  decimales: number
  ponderadorMinimo: number | null
  verAcumulado: boolean
  estado: 'activo' | 'inactivo'
  nivelesInterpretacion: number
  // TODO (futuro Claude): niveles se guardará en tabla separada gkpis_ciclos_niveles
  //   con columnas: id, ciclo_id (FK), nombre, tope, orden
  niveles: NivelInterpretacion[]
}
