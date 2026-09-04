import type { RouteRecordRaw } from 'vue-router'

/**
 * Stand-in for `remoteDragonball/routes` during host unit tests: the same shape
 * the federated contract promises, with throwaway components.
 */
export const characterRoutes: RouteRecordRaw[] = [
  {
    path: '/dragon-ball',
    name: 'character-list',
    component: { template: '<div>list</div>' },
    meta: { navLabel: 'Dragon Ball' },
  },
  {
    path: '/dragon-ball/:id',
    name: 'character-detail',
    component: { template: '<div>detail</div>' },
  },
]
