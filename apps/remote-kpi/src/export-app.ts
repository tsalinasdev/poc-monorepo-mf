// El contrato federado del remote: la app completa se expone a través del
// Bridge (`createBridgeComponent`), así que el remote conserva su router y su
// Pinia mientras el host monta la sección. Ver ADR 0005.
import '@/assets/main.css'

import { createBridgeComponent } from '@module-federation/bridge-vue3'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'
import { kpiRoutes } from './router'

/**
 * Rutas basename-relative por contrato: el bridge descarta este router y lo
 * recrea con `createWebHistory(basename)` (el path de la sección que deriva de
 * la ruta matched del host), así que las mismas rutas relativas resuelven
 * standalone (base `/`) y federadas (base `/gestion-kpi`).
 *
 * A diferencia de los mocks de Pokémon/Dragon Ball (que piden una API por
 * proxy), este remote no necesita variables de entorno: sus datos son los
 * mocks locales de `api/`.
 */
export default createBridgeComponent({
  rootComponent: App,
  appOptions: ({ app }) => {
    app.use(createPinia())

    const router = createRouter({
      history: createWebHistory(import.meta.env.BASE_URL),
      routes: kpiRoutes,
    })

    return { router }
  },
})
