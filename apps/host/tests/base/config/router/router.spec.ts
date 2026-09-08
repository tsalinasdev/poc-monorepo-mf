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

function failingRemote(id: string, navLabel: string, basePath: string, routeName: string) {
  return {
    id,
    routeName,
    navLabel,
    basePath,
    loadApp: () => Promise.reject(new Error(`${id} is down`)),
  }
}

function workingRemote(id: string, navLabel: string, basePath: string, routeName: string) {
  return {
    id,
    routeName,
    navLabel,
    basePath,
    // Mirrors `createRemoteAppComponent(...)`: a functional Vue component.
    loadApp: () => Promise.resolve(stubComponent),
  }
}

describe('with every remote reachable', () => {
  it('registers a catch-all per remote under the shell layout', async () => {
    const router = await shellWithRealRemotes()
    await router.push('/pokemons')
    await router.isReady()

    const matched = router.currentRoute.value.matched

    expect(matched).toHaveLength(2)
    expect(matched[0]?.path).toBe('/') // host layout route
    // With bridge/manifest the host no longer sees the remote's route names —
    // it owns the section name itself (e.g. `remote-pokemon`).
    expect(matched[1]?.name).toBe('remote-pokemon')
  })

  it('does the same for the dragon ball section', async () => {
    const router = await shellWithRealRemotes()
    await router.push('/dragon-ball')
    await router.isReady()

    const matched = router.currentRoute.value.matched

    expect(matched).toHaveLength(2)
    expect(matched[0]?.path).toBe('/')
    expect(matched[1]?.name).toBe('remote-dragonball')
  })

  it('redirects the root path to the first remote section', async () => {
    const router = await shellWithRealRemotes()
    await router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('remote-pokemon')
  })

  it('keeps every deep path inside the same layout too', async () => {
    const router = await shellWithRealRemotes()

    // The catch-all consumes everything under `/pokemons/*` and `/dragon-ball/*`.
    await router.push('/pokemons/pikachu')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('remote-pokemon')
    expect(router.currentRoute.value.matched[0]?.path).toBe('/')

    await router.push('/dragon-ball/1')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('remote-dragonball')
    expect(router.currentRoute.value.matched[0]?.path).toBe('/')
  })

  it('keeps the two remotes on separate path namespaces', async () => {
    const router = await shellWithRealRemotes()

    // Only the host layout route and the shell-level catch-all live at the
    // top level; the per-remote catch-alls are nested under `path: '/'`.
    const remotePaths = router
      .getRoutes()
      .map((route) => route.path)
      .filter((path) => path !== '/' && !path.includes('pathMatch'))

    expect(remotePaths).toEqual([])
    expect(router.getRoutes().find((r) => r.name === 'remote-pokemon')?.path).toBe(
      '/pokemons/:pathMatch(.*)*',
    )
    expect(router.getRoutes().find((r) => r.name === 'remote-dragonball')?.path).toBe(
      '/dragon-ball/:pathMatch(.*)*',
    )
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
    failingRemote('remoteBroken', 'Broken', '/broken', 'remote-broken'),
    workingRemote('remoteHealthy', 'Healthy', '/healthy', 'remote-healthy'),
  ]

  it('still boots the shell and keeps the healthy remote working', async () => {
    const router = createShellRouter()
    await registerRemoteRoutes(router, remotes)

    await router.push('/healthy')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('remote-healthy')
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
      failingRemote('remoteA', 'A', '/a', 'remote-a'),
      failingRemote('remoteB', 'B', '/b', 'remote-b'),
    ])

    expect(registrations.every((r) => r.status === 'unavailable')).toBe(true)

    await router.push('/something-else')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('not-found')
  })
})
