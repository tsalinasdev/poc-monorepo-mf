export interface Rango {
  minimo: number
  maximo: number
  resultado: number
}

export interface Variable {
  nombre: string
  valorPrueba: number
}

export interface Kpi {
  id: number
  cicloKpi: string
  nombreKpi: string
  unidadMedida: string | null
  tipoCalculo: 'ponderado' | 'directo' | 'tabla' | 'funcion' | 'indirecto'
  dependencia: 'estandar' | 'padre'
  kpiPadre: number | null
  kpiHijos: number[]
  descripcionKpi: string | null
  estado: 'activo' | 'inactivo'
  rangosCount: number
  rangos: Rango[]
  variablesCount: number
  variables: Variable[]
  funcionFormula: string | null
  medicionMinima: number | null
  medicionMaxima: number | null
  resultadoMinimo: number | null
  resultadoMaximo: number | null
  tendencia: 'positiva' | 'negativa' | null
}
