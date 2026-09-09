import { ref, type Ref } from 'vue'

// Singleton (fuera de la función): todas las vistas que lo importan comparten
// la misma ref, así el ciclo seleccionado en un filtro queda sincronizado en
// toda la app en vez de resetear a "el último ciclo" al montar cada vista.
const selectedCicloId = ref<number | null>(null)

export function useSelectedCiclo(): { selectedCicloId: Ref<number | null> } {
  return { selectedCicloId }
}
