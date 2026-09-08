// The remote's federated contract. This file is what the host loads through
// `mf-manifest.json` and mounts via `createRemoteAppComponent`. By exporting
// the WHOLE app (not a list of routes) we give the remote ownership of its
// navigation: the host only mounts us once per section and we run our own
// router, our own Pinia, our own Pinia-Colada cache and our own dependency
// injection container. See ADR 0005 for the reasoning.
import '@/assets/main.css'

import { createBridgeComponent } from '@module-federation/bridge-vue3'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'
import { pokemonRoutes } from './modules/pokemon/presentation/routes/pokemon.routes'
import { coladaOptions } from './base/config/colada/colada.options'

/**
 * Strip the section's `basename` prefix from every route path. The bridge's
 * inner router is built with `createWebHistory(basename)`, so any URL it
 * pushes or replaces is prefixed with that basename. If the routes themselves
 * ALSO start with the basename, a navigation to `/pokemons` becomes
 * `/pokemons/pokemons` in the browser URL (the basename prefix is added on
 * top of the absolute route path). The routes must therefore be relative to
 * the basename.
 *
 * Standalone mode has no basename: the routes stay absolute and the standalone
 * router mounts them at `/`.
 *
 * `basename` is provided by the host when it mounts the bridged component.
 * It is the section path (`/pokemons`) so the inner router can resolve
 * `/pokemons/pikachu` to the detail screen while the host sees the same URL.
 */
function routesRelativeTo(basename: string | undefined) {
  if (!basename) return pokemonRoutes
  const prefix = basename.replace(/\/+$/, '')
  return pokemonRoutes.map((route) => ({
    ...route,
    path: route.path.startsWith(prefix + '/')
      ? route.path.slice(prefix.length)
      : route.path === prefix
        ? '/'
        : route.path,
  }))
}

export default createBridgeComponent({
  rootComponent: App,
  appOptions: ({ app, basename }) => {
    app.use(createPinia())
    app.use(PiniaColada, coladaOptions)

    const router = createRouter({
      history: createWebHistory(basename ?? import.meta.env.BASE_URL),
      routes: [{ path: '/', redirect: { name: 'pokemon-list' } }, ...routesRelativeTo(basename)],
    })

    return { router }
  },
})
