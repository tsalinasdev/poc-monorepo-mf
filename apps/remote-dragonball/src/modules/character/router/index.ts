import type { RouteRecordRaw } from 'vue-router'

/**
 * Routes RELATIVE to the app's base:
 * - standalone the base is `/` (the dev server serves the app at its root);
 * - federated the bridge rebuilds the router with `createWebHistory(basename)`
 *   (the section path derived by the host), so `/dragon-ball/1` resolves to
 *   `/:id`.
 */
export const characterRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'character-list',
    component: () => import('../views/CharacterListView.vue'),
  },
  {
    path: '/:id',
    name: 'character-detail',
    component: () => import('../views/CharacterDetailView.vue'),
  },
]
