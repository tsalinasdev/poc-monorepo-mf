import { createRouter, createWebHistory, type Router } from 'vue-router'
import { REMOTES, type RemoteDefinition } from './remotes'

/** The shell's own route: the chrome every remote screen renders inside. */
const SHELL_ROUTE_NAME = 'shell'

export type RemoteStatus = 'loaded' | 'unavailable'

export interface RemoteRegistration {
  id: string
  status: RemoteStatus
  error?: unknown
}

/**
 * Composition root of the shell. The host owns the layout and the history mode;
 * each remote owns its own paths and screens and contributes them at runtime.
 */
export function createShellRouter(): Router {
  return createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
      {
        path: '/',
        name: SHELL_ROUTE_NAME,
        component: () => import('@/modules/shared/presentation/layouts/public/PublicLayout.vue'),
        // Filled in by registerRemoteRoutes(): the shell knows nothing about
        // remote paths until their contracts have actually loaded.
        children: [],
      },
    ],
  })
}

/**
 * Loads every remote contract and mounts its routes inside the shell.
 *
 * `allSettled`, not `all`: one unreachable remote degrades ITS OWN section and
 * nothing else. The shell boots, the navbar renders, and every remote that did
 * load works normally. With the previous static imports, any single failure
 * took the whole application down with it.
 *
 * Returns one registration per remote so the caller can log or report which
 * ones came up — the shell does not decide that policy.
 */
export async function registerRemoteRoutes(
  router: Router,
  remotes: readonly RemoteDefinition[] = REMOTES,
): Promise<RemoteRegistration[]> {
  const outcomes = await Promise.allSettled(remotes.map((remote) => remote.loadRoutes()))

  // The route each section lands on, in catalogue order. Used for the index
  // redirect so that '/' still works when the first remote is the one missing.
  const landingRouteNames: string[] = []

  const registrations = remotes.map((remote, index): RemoteRegistration => {
    const outcome = outcomes[index]

    if (outcome?.status === 'fulfilled') {
      outcome.value.forEach((route) => router.addRoute(SHELL_ROUTE_NAME, route))

      const landing = outcome.value[0]?.name
      if (landing) landingRouteNames.push(String(landing))

      return { id: remote.id, status: 'loaded' }
    }

    // Degraded mode: keep the section in the navbar and answer its base path
    // with an explanation, instead of a dead link or a blank page.
    const unavailableName = `${remote.id}-unavailable`
    router.addRoute(SHELL_ROUTE_NAME, {
      path: remote.basePath,
      name: unavailableName,
      component: () => import('@/modules/shared/presentation/screens/RemoteUnavailableScreen.vue'),
      props: { sectionLabel: remote.navLabel },
      meta: { navLabel: remote.navLabel },
    })
    landingRouteNames.push(unavailableName)

    return { id: remote.id, status: 'unavailable', error: outcome?.reason }
  })

  // Added last so they can never shadow a route a remote contributed.
  const landing = landingRouteNames[0]
  router.addRoute(SHELL_ROUTE_NAME, {
    path: '',
    name: 'shell-index',
    ...(landing
      ? { redirect: { name: landing } }
      : {
          component: () =>
            import('@/modules/shared/presentation/screens/RemoteUnavailableScreen.vue'),
        }),
  })

  router.addRoute(SHELL_ROUTE_NAME, {
    path: ':pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/modules/shared/presentation/screens/NotFoundScreen.vue'),
  })

  return registrations
}

const router = createShellRouter()

export default router
