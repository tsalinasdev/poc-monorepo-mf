import type { RouteRecordRaw } from 'vue-router'
import { createShellRouter, registerRemoteRoutes } from '@/base/config/router'
import { REMOTES } from '@/base/config/router/remotes'

// The host's only real logic is how it composes the shell with its remotes, so
// that composition is what gets tested — against stubs of the federated
// contracts (see vite.config.ts aliases) and against remotes that never answer.

async function shellWithRealRemotes() {
  const router = createShellRouter()
  await registerRemoteRoutes(router)
  return router
}

const stubComponent = { template: '<div />' }

function failingRemote(id: string, navLabel: string, basePath: string) {
  return {
    id,
    navLabel,
    basePath,
    loadRoutes: () => Promise.reject(new Error(`${id} is down`)),
  }
}

function workingRemote(id: string, navLabel: string, basePath: string, routeName: string) {
  return {
    id,
    navLabel,
    basePath,
    loadRoutes: () =>
      Promise.resolve<RouteRecordRaw[]>([
        { path: basePath, name: routeName, component: stubComponent, meta: { navLabel } },
      ]),
  }
}

describe('with every remote reachable', () => {
  it('renders pokemon remote routes inside the host layout', async () => {
    const router = await shellWithRealRemotes()
    await router.push('/pokemons')
    await router.isReady()

    const matched = router.currentRoute.value.matched

    expect(matched).toHaveLength(2)
    expect(matched[0]?.path).toBe('/') // host layout route
    expect(matched[1]?.name).toBe('pokemon-list') // remote screen, nested in it
  })

  it('renders dragon ball remote routes inside the same layout', async () => {
    const router = await shellWithRealRemotes()
    await router.push('/dragon-ball')
    await router.isReady()

    const matched = router.currentRoute.value.matched

    expect(matched).toHaveLength(2)
    expect(matched[0]?.path).toBe('/')
    expect(matched[1]?.name).toBe('character-list')
  })

  it('redirects the root path to the first remote list route', async () => {
    const router = await shellWithRealRemotes()
    await router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('pokemon-list')
  })

  it('keeps each remote detail route inside the layout too', async () => {
    const router = await shellWithRealRemotes()

    await router.push('/pokemons/pikachu')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('pokemon-detail')
    expect(router.currentRoute.value.params.name).toBe('pikachu')
    expect(router.currentRoute.value.matched[0]?.path).toBe('/')

    await router.push('/dragon-ball/1')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('character-detail')
    expect(router.currentRoute.value.params.id).toBe('1')
    expect(router.currentRoute.value.matched[0]?.path).toBe('/')
  })

  it('keeps the two remotes on separate path namespaces', async () => {
    const router = await shellWithRealRemotes()

    // '/' and the catch-all belong to the host; everything else comes from a remote.
    const remotePaths = router
      .getRoutes()
      .map((route) => route.path)
      .filter((path) => path !== '/' && !path.includes('pathMatch'))

    expect(remotePaths).toContain('/pokemons')
    expect(remotePaths).toContain('/dragon-ball')
    expect(new Set(remotePaths).size).toBe(remotePaths.length) // no collisions
  })

  it('reports every remote as loaded', async () => {
    const router = createShellRouter()
    const registrations = await registerRemoteRoutes(router)

    expect(registrations.map((registration) => registration.status)).toEqual(['loaded', 'loaded'])
    expect(registrations.map((registration) => registration.id)).toEqual(
      REMOTES.map((remote) => remote.id),
    )
  })
})

// The reason this whole registration exists: a remote is a SEPARATE deployment,
// so it can be down while the shell is perfectly healthy.
describe('with a remote that cannot be loaded', () => {
  const remotes = [
    failingRemote('remoteBroken', 'Broken', '/broken'),
    workingRemote('remoteHealthy', 'Healthy', '/healthy', 'healthy-list'),
  ]

  it('still boots the shell and keeps the healthy remote working', async () => {
    const router = createShellRouter()
    await registerRemoteRoutes(router, remotes)

    await router.push('/healthy')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('healthy-list')
    expect(router.currentRoute.value.matched[0]?.path).toBe('/')
  })

  it('answers the broken section with an explanation instead of a blank page', async () => {
    const router = createShellRouter()
    await registerRemoteRoutes(router, remotes)

    await router.push('/broken')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('remoteBroken-unavailable')
    expect(router.currentRoute.value.matched[0]?.path).toBe('/') // still inside the shell
  })

  it('keeps the broken section in the navigation', async () => {
    const router = createShellRouter()
    await registerRemoteRoutes(router, remotes)

    const labels = router
      .getRoutes()
      .filter((route) => typeof route.meta?.navLabel === 'string')
      .map((route) => route.meta.navLabel)

    expect(labels).toEqual(['Broken', 'Healthy'])
  })

  it('reports which remote failed, and why', async () => {
    const router = createShellRouter()
    const registrations = await registerRemoteRoutes(router, remotes)

    expect(registrations).toEqual([
      { id: 'remoteBroken', status: 'unavailable', error: expect.any(Error) },
      { id: 'remoteHealthy', status: 'loaded' },
    ])
    expect(registrations[0]?.error).toMatchObject({ message: 'remoteBroken is down' })
  })

  // '/' used to redirect to a hardcoded remote route name. If that remote is the
  // one that is down, the redirect would target a route that does not exist.
  it('still resolves the root path when the FIRST remote is the missing one', async () => {
    const router = createShellRouter()
    await registerRemoteRoutes(router, remotes)

    await router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('remoteBroken-unavailable')
  })
})

describe('with no remote available at all', () => {
  it('boots, and every address falls back to a host-owned screen', async () => {
    const router = createShellRouter()
    const registrations = await registerRemoteRoutes(router, [
      failingRemote('remoteA', 'A', '/a'),
      failingRemote('remoteB', 'B', '/b'),
    ])

    expect(registrations.every((r) => r.status === 'unavailable')).toBe(true)

    await router.push('/something-else')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('not-found')
  })
})
