/**
 * Tabs internos del módulo (navegación del remote, no del shell).
 *
 * En kpi-project estos paths eran absolutos (`/gestion-kpi/ciclos`). Federado,
 * el basename lo pone el host (`/gestion-kpi`): un path absoluto duplicaría el
 * prefijo. Cada tab lleva ahora el `name` de su ruta y la navegación se hace
 * con `router.push({ name })`, que es basename-agnóstico.
 */
export type ConfiguracionTabId = 'ciclos' | 'kpi' | 'asignacion' | 'resultados'
export type ConfiguracionTabName = 'ciclos' | 'kpi' | 'asignacion' | 'resultados'

export interface ConfiguracionTab {
  readonly id: ConfiguracionTabId
  readonly label: string
  readonly name: ConfiguracionTabName
  readonly icon: string
}

export const CONFIGURACION_TABS: readonly ConfiguracionTab[] = [
  { id: 'ciclos', label: 'Ciclos KPI', name: 'ciclos', icon: '/img/main/cycle.svg' },
  { id: 'kpi', label: 'KPI', name: 'kpi', icon: '/img/main/readiness-score.svg' },
  {
    id: 'asignacion',
    label: 'Asignación',
    name: 'asignacion',
    icon: '/img/main/family-history.svg',
  },
  {
    id: 'resultados',
    label: 'Resultados',
    name: 'resultados',
    icon: '/img/main/edit-document.svg',
  },
] as const
