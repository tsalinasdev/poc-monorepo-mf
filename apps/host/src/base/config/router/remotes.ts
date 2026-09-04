import type { RouteRecordRaw } from 'vue-router'

/**
 * The shell's catalogue of remotes.
 *
 * `loadRoutes` is a DYNAMIC import on purpose. A static `import ... from
 * 'remotePokemon/routes'` makes the remote entry a hard dependency of the host
 * bundle: one remote returning a 404 or a 500 and the whole shell never boots —
 * blank page, no navbar, every other remote unreachable too. That is the worst
 * possible failure mode for an architecture whose entire point is that each
 * piece deploys on its own.
 *
 * `navLabel` and `basePath` are duplicated from the remote's own route records
 * ONLY as a degraded-mode fallback: when a remote loads, everything comes from
 * its contract exactly as before and these two fields are unused. They exist so
 * the shell can still name and place a section it could not load.
 */
export interface RemoteDefinition {
  /** Matches the name in module-federation.config.ts — used in diagnostics. */
  id: string
  /** Fallback nav label, used only if the remote fails to load. */
  navLabel: string
  /** Fallback section path, used only if the remote fails to load. */
  basePath: string
  loadRoutes: () => Promise<RouteRecordRaw[]>
}

export const REMOTES: readonly RemoteDefinition[] = [
  {
    id: 'remotePokemon',
    navLabel: 'Pokédex',
    basePath: '/pokemons',
    loadRoutes: () => import('remotePokemon/routes').then((module) => module.pokemonRoutes),
  },
  {
    id: 'remoteDragonball',
    navLabel: 'Dragon Ball',
    basePath: '/dragon-ball',
    loadRoutes: () => import('remoteDragonball/routes').then((module) => module.characterRoutes),
  },
]
