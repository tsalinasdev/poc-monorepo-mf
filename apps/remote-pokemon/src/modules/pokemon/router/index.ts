import type { RouteRecordRaw } from 'vue-router'

/**
 * Routes RELATIVE to the app's base:
 * - standalone the base is `/` (the dev server serves the app at its root);
 * - federated the bridge rebuilds the router with `createWebHistory(basename)`
 *   (the section path derived by the host), so `/pokemons/pikachu` resolves to
 *   `/:name`.
 */
export const pokemonRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'pokemon-list',
    component: () => import('../views/PokemonListView.vue'),
  },
  {
    path: '/:name',
    name: 'pokemon-detail',
    component: () => import('../views/PokemonDetailView.vue'),
  },
]
