export interface Area {
  id: number
  nombre: string
}

export interface Cargo {
  id: number
  nombre: string
  areaId: number
  nivelJerarquico: 'director' | 'gerente' | 'jefatura' | 'profesional' | 'tecnico'
}

export interface Usuario {
  id: number
  nombre: string
  apellido: string
  rut: string
  email: string
  areaId: number
  cargoId: number
  rolKpi: 'lider' | 'liderLider' | 'trabajador'
}
