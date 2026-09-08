// The remote's federated contract: the whole app is exposed through the
// Bridge (`createBridgeComponent`), so the remote keeps owning its router,
// Pinia and Pinia-Colada while the host only mounts the section. See ADR 0005.
import '@/assets/main.css'

import { createBridgeComponent } from '@module-federation/bridge-vue3'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'
import { characterRoutes } from './modules/character/router'
import { coladaOptions } from './modules/shared/config/colada'

/**
 * Routes are basename-relative by contract: the bridge discards this router
 * and recreates it with `createWebHistory(basename)` (the section path it
 * derives from the host's matched route), so the same relative routes resolve
 * standalone (base `/`) and federated (base `/dragon-ball`).
 */
export default createBridgeComponent({
  rootComponent: App,
  appOptions: ({ app }) => {
    app.use(createPinia())
    app.use(PiniaColada, coladaOptions)

    const router = createRouter({
      history: createWebHistory(import.meta.env.BASE_URL),
      routes: characterRoutes,
    })

    return { router }
  },
})
