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
export const characterRoutes: RouteRecordRaw[] = [
  {
    path: '/dragon-ball',
    name: 'character-list',
    component: () => import('../screens/character-list/CharacterListScreen.vue'),
  },
  {
    path: '/dragon-ball/:id',
    name: 'character-detail',
    component: () => import('../screens/character-detail/CharacterDetailScreen.vue'),
  },
]
