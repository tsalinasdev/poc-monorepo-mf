import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import configuracionRoutes from '@/modules/configuracion/router'

/**
 * Rutas basename-relative: el wrapper vive en `''` y el bridge deriva el
 * basename del host (standalone `/`, federado `/gestion-kpi`).
 *
 * Cada ruta de tab lleva `name` porque TODA navegación interna usa nombres
 * (`router.push({ name })`), nunca paths absolutos: un path absoluto
 * `/gestion-kpi/...` duplicaría el basename bajo el bridge.
 */
export const kpiRoutes = [
  {
    path: '',
    component: MainLayout,
    children: configuracionRoutes,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: kpiRoutes,
})

export default router
