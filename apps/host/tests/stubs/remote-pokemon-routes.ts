import type { RouteRecordRaw } from 'vue-router'

/**
 * Stand-in for `remotePokemon/routes` during host unit tests: the same shape the
 * federated contract promises, with throwaway components. If the remote ever
 * changes that shape, this stub — and the host — must change with it.
 */
export const pokemonRoutes: RouteRecordRaw[] = [
  {
    path: '/pokemons',
    name: 'pokemon-list',
    component: { template: '<div>list</div>' },
    meta: { navLabel: 'Pokédex' },
  },
  {
    path: '/pokemons/:name',
    name: 'pokemon-detail',
    component: { template: '<div>detail</div>' },
  },
]
