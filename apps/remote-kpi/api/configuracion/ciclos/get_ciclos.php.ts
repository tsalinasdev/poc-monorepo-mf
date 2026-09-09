// GET /api/configuracion/ciclos/get_ciclos.php
// Param requerido: empresas_id (int)
// Tabla: gkpis_ciclos
//
// TODO (futuro Claude): reemplazar loadCiclos/saveCiclos/get() con fetch real al backend PHP.
//   La firma de get() debe mantenerse: () => Promise<Ciclo[]>
//   Ejemplo de reemplazo:
//     export async function get(empresas_id: number): Promise<Ciclo[]> {
//       const res = await fetch(`/api/configuracion/ciclos/get_ciclos.php?empresas_id=${empresas_id}`)
//       return res.json()
//     }
//   Una vez migrado, eliminar loadCiclos, saveCiclos y el STORAGE_KEY.
//   Los demás archivos (post, put, delete) también importan loadCiclos/saveCiclos — migrarlos en conjunto.

export type { Ciclo, NivelInterpretacion } from './types'
import type { Ciclo } from './types'

// TODO (futuro Claude): eliminar STORAGE_KEY, loadCiclos y saveCiclos cuando el backend esté listo.
//   Son exclusivamente para el mock de localStorage.
const STORAGE_KEY = 'kpi_ciclos'

export function loadCiclos(): Ciclo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCiclos(ciclos: Ciclo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ciclos))
}

export async function get(): Promise<Ciclo[]> {
  // TODO (futuro Claude): reemplazar con fetch al endpoint PHP real (ver comentario arriba)
  return loadCiclos()
}
