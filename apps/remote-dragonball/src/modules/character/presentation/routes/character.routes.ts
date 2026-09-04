// This module is the federated entry (`remoteDragonball/routes`), so it is also
// where the remote's stylesheet is pulled in: the host builds its own Tailwind
// output from its own sources and knows nothing about the classes these screens
// use. Importing it here guarantees the styles ship with whatever loads the
// contract — host or standalone.
import '@/assets/main.css'

import type { RouteRecordRaw } from 'vue-router'

export const characterRoutes: RouteRecordRaw[] = [
  {
    path: '/dragon-ball',
    name: 'character-list',
    component: () => import('../screens/character-list/CharacterListScreen.vue'),
    // `navLabel` is the opt-in half of the contract: any route carrying it shows
    // up in the host's navigation, so adding a remote needs no host layout change.
    meta: { navLabel: 'Dragon Ball' },
  },
  {
    path: '/dragon-ball/:id',
    name: 'character-detail',
    component: () => import('../screens/character-detail/CharacterDetailScreen.vue'),
  },
]
