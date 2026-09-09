import { ref, type Ref } from 'vue'

const LS_KEY = 'kpi_last_ciclo'
const lastCicloKpi = ref<string | null>(localStorage.getItem(LS_KEY))

/**
 * Singleton persistido en localStorage: recuerda el último ciclo usado al
 * crear un KPI, para preseleccionarlo la próxima vez que se abra el drawer.
 */
export function useLastCicloKpi(): {
  lastCicloKpi: Ref<string | null>
  setLastCicloKpi: (ciclo: string) => void
} {
  function setLastCicloKpi(ciclo: string): void {
    lastCicloKpi.value = ciclo
    localStorage.setItem(LS_KEY, ciclo)
  }

  return { lastCicloKpi, setLastCicloKpi }
}
