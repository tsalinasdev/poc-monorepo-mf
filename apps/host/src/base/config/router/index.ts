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
 * each remote owns its app and contributes it at runtime as a bridged component.
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
 * Loads every remote contract and mounts a catch-all route per remote under
 * the shell. The remote is mounted once per section (`/pokemons/*`,
 * `/dragon-ball/*`) and its bridge takes care of internal navigation.
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
  const outcomes = await Promise.allSettled(remotes.map((remote) => remote.loadApp()))

  // The route name the shell-landing redirect should target, in catalogue
  // order. Used so that '/' still works when the FIRST remote is the missing
  // one — we land on its degraded screen instead of a 404.
  const landingRouteNames: string[] = []

  const registrations = remotes.map((remote, index): RemoteRegistration => {
    const outcome = outcomes[index]

    if (outcome?.status === 'fulfilled') {
      const RemoteApp = outcome.value

      // One catch-all per section. The remote's bridge receives `basename`
      // (its section path) so its internal router resolves /pokemons/:name
      // against the same URL the host sees. The `basePath` lands in `meta`
      // so `usePublicLayoutViewModel` can match the current URL against it
      // (the route's own `path` is the catch-all template, not the section
      // prefix).
      router.addRoute(SHELL_ROUTE_NAME, {
        path: `${remote.basePath}/:pathMatch(.*)*`,
        name: remote.routeName,
        component: RemoteApp,
        props: { basename: remote.basePath },
        meta: { navLabel: remote.navLabel, basePath: remote.basePath },
      })

      landingRouteNames.push(remote.routeName)
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
  // The redirect uses the section's `basePath` directly — routing by NAME to
  // a catch-all route (`/pokemons/:pathMatch(.*)*`) makes vue-router emit a
  // doubled path (`/pokemons/pokemons`) because the empty `:pathMatch` is
  // resolved against the current URL. Going through `basePath` skips that
  // ambiguity.
  const landing = remotes.find((remote, index) => landingRouteNames[index] === landingRouteNames[0])
  router.addRoute(SHELL_ROUTE_NAME, {
    path: '',
    name: 'shell-index',
    ...(landing
      ? { redirect: landing.basePath }
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
