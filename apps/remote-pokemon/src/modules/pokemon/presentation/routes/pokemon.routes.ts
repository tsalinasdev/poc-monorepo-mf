import type { RouteRecordRaw } from 'vue-router'

/**
 * Routes consumed by this remote's standalone router (`src/base/config/router`)
 * and — until the host stopped needing to know about them — by the federated
 * contract. With the move to `createBridgeComponent` (ADR 0005) the host no
 * longer sees these routes; it mounts the bridge as a single catch-all under
 * the section path. The route definitions stay here because the standalone
 * mode still needs them and the screens still own their paths.
 *
 * The CSS lives at the entry points (`main.ts` for standalone, `export-app.ts`
 * for federated) so a remote is never loaded without its styles.
 */
export const pokemonRoutes: RouteRecordRaw[] = [
  {
    path: '/pokemons',
    name: 'pokemon-list',
    component: () => import('../screens/pokemon-list/PokemonListScreen.vue'),
  },
  {
    path: '/pokemons/:name',
    name: 'pokemon-detail',
    component: () => import('../screens/pokemon-detail/PokemonDetailScreen.vue'),
  },
]
