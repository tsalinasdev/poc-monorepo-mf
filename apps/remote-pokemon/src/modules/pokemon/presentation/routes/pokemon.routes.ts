// This module is the federated entry (`remotePokemon/routes`), so it is also
// where the remote's stylesheet is pulled in: the host builds its own Tailwind
// output from its own sources and knows nothing about the classes these screens
// use. Importing it here guarantees the styles ship with whatever loads the
// contract — host or standalone.
import '@/assets/main.css'

import type { RouteRecordRaw } from 'vue-router'

export const pokemonRoutes: RouteRecordRaw[] = [
  {
    path: '/pokemons',
    name: 'pokemon-list',
    component: () => import('../screens/pokemon-list/PokemonListScreen.vue'),
    // `navLabel` is the opt-in half of the contract: any route carrying it shows
    // up in the host's navigation, so adding a remote needs no host layout change.
    meta: { navLabel: 'Pokédex' },
  },
  {
    path: '/pokemons/:name',
    name: 'pokemon-detail',
    component: () => import('../screens/pokemon-detail/PokemonDetailScreen.vue'),
  },
]
