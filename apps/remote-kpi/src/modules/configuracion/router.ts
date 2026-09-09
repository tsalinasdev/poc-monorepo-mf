import CiclosView from './views/CiclosView.vue'
import KpisView from './views/KpisView.vue'
import AsignacionView from './views/AsignacionView.vue'
import AsignacionDetalleView from './views/AsignacionDetalleView.vue'
import ResultadosView from './views/ResultadosView.vue'

/**
 * Rutas relativas al basename (standalone `/`, federado `/gestion-kpi`).
 * Los nombres son el contrato de navegación interna: MainLayout y las vistas
 * navegan con `router.push({ name })` — nunca con paths absolutos, que bajo el
 * bridge duplicarían el basename.
 */
export default [
  { path: '', redirect: 'ciclos' },
  { path: 'ciclos', name: 'ciclos', component: CiclosView },
  { path: 'kpi', name: 'kpi', component: KpisView },
  { path: 'asignacion', name: 'asignacion', component: AsignacionView },
  {
    path: 'asignacion/detalle/:asignacionId/:userId',
    name: 'asignacion-detalle',
    component: AsignacionDetalleView,
    meta: { hideTabs: true, hideCard: true },
  },
  { path: 'resultados', name: 'resultados', component: ResultadosView },
]
