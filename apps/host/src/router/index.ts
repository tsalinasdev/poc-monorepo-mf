import { createRouter, createWebHistory, type Router } from 'vue-router'
import { REMOTES, type RemoteDefinition } from './remotes'

export type RemoteStatus = 'loaded' | 'unavailable'

export interface RemoteRegistration {
  id: string
  status: RemoteStatus
  error?: unknown
}

/**
 * Composition root of the shell: the host owns the history mode and registers
 * each remote's bridged app at runtime. The layout is static chrome in
 * App.vue (not a route), so a remote's catch-all is the FIRST matched route —
 * that is what lets createRemoteAppComponent derive the section's `basename`
 * from `matched[0].path` on its own.
 */
export function createShellRouter(): Router {
  return createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [],
  })
}

/**
 * Loads every remote contract and mounts a catch-all route per remote.
 * `allSettled`, not `all`: one unreachable remote degrades its own section
 * (unavailable screen + navbar entry) and the rest of the shell boots.
 */
export async function registerRemoteRoutes(
  router: Router,
  remotes: readonly RemoteDefinition[] = REMOTES,
): Promise<RemoteRegistration[]> {
  const outcomes = await Promise.allSettled(remotes.map((remote) => remote.loadApp()))

  const registrations = remotes.map((remote, index): RemoteRegistration => {
    const outcome = outcomes[index]

    if (outcome?.status === 'fulfilled') {
      // Top-level catch-all: the bridge strips the `/:pathMatch(.*)*` suffix
      // from `matched[0].path` and uses the rest as the remote's basename.
      router.addRoute({
        path: `${remote.basePath}/:pathMatch(.*)*`,
        name: remote.routeName,
        component: outcome.value,
        meta: { navLabel: remote.navLabel, basePath: remote.basePath },
      })
      return { id: remote.id, status: 'loaded' }
    }

    // Degraded mode: keep the section in the navbar and answer its base path
    // with an explanation instead of a dead link.
    router.addRoute({
      path: remote.basePath,
      name: `${remote.id}-unavailable`,
      component: () => import('@/modules/shell/views/RemoteUnavailableView.vue'),
      props: { sectionLabel: remote.navLabel },
      meta: { navLabel: remote.navLabel },
    })
    return { id: remote.id, status: 'unavailable', error: outcome?.reason }
  })

  // Redirect '/' to the first section. By path, not by name: the name points
  // at a catch-all template and resolving against the current URL would emit
  // a doubled path (`/pokemons/pokemons`). When the first remote is down this
  // lands on its unavailable screen.
  const [landing] = remotes
  router.addRoute({
    path: '',
    name: 'shell-index',
    ...(landing
      ? { redirect: landing.basePath }
      : {
          component: () => import('@/modules/shell/views/RemoteUnavailableView.vue'),
        }),
  })

  // Registered last and scored lowest by vue-router, so it only catches
  // addresses no remote section claimed.
  router.addRoute({
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/modules/shell/views/NotFoundView.vue'),
  })

  return registrations
}

const router = createShellRouter()

export default router
