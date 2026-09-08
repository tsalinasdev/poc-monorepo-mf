import type { Component } from 'vue'
import { createRemoteAppComponent } from '@module-federation/bridge-vue3'

/**
 * The shell's catalogue of remotes.
 *
 * The remote is a self-contained Vue app exposed via `createBridgeComponent`
 * (`@module-federation/bridge-vue3`); the host mounts it through
 * `createRemoteAppComponent`, which produces a Vue component that loads the
 * bridge function from the remote's manifest and wraps it with lifecycle
 * (`render`/`destroy`). The host never sees the remote's routes, router or
 * Pinia — those live inside the bridge. See ADR 0005.
 *
 * `loadApp` is a DYNAMIC import on purpose. A static `import ... from
 * 'remotePokemon/export-app'` makes the remote a hard dependency of the host
 * bundle: one remote returning a 404 or a 500 and the whole shell never boots —
 * blank page, no navbar, every other remote unreachable too. That is the worst
 * possible failure mode for an architecture whose entire point is that each
 * piece deploys on its own.
 *
 * The dynamic import string is **static per remote** on purpose: the Vite MF
 * plugin only transforms `import()` calls whose specifier is a *literal*
 * matching a known remote. Template literals like
 * `import(\`${id}/export-app\`)` slip past the plugin and reach the browser,
 * which then fails with `Failed to resolve module specifier`. Each remote's
 * loader is a thin wrapper around a literal import so the plugin can rewrite
 * it to a `loadRemote(...)` against `mf-manifest.json` (and Vitest's alias
 * mechanism can resolve it to `tests/stubs/remote-*-export-app.ts` in unit
 * tests). Adding a new remote = adding one entry below + one loader; not a
 * loop.
 *
 * `navLabel`, `basePath` and `routeName` live in the host, not the remote, so
 * the layout (UX: idioma, copy, orden) and the host router's path naming stay
 * in one place. They are also used as the degraded-mode fallback when a
 * remote fails to load: the section stays in the navbar and its base path
 * shows a friendly explanation.
 */
export interface RemoteDefinition {
  /** Matches the name in module-federation.config.ts — used in diagnostics. */
  id: string
  /** Vue Router name for the section catch-all route. */
  routeName: string
  /** Label rendered in the navbar. Host-owned: idioma/copy/orden son UX. */
  navLabel: string
  /** Section path; doubles as `basename` passed to the bridge. */
  basePath: string
  loadApp: () => Promise<Component>
}

/**
 * Per-remote loaders. The specifier is a static string literal so the MF
 * plugin's static-analysis step (`isRemoteImport(source)`) can match it
 * against `remotes` in `module-federation.config.ts` and rewrite the
 * `import()` into `loadRemote(...)`. See `vite.config.ts` for the test-mode
 * alias that resolves the same specifier to the unit-test stub.
 */
const loadPokemonBridge = () => import('remotePokemon/export-app')
const loadDragonballBridge = () => import('remoteDragonball/export-app')

const bridgeComponentFor = (loader: () => Promise<unknown>) =>
  createRemoteAppComponent({
    // Cast: the loader returns `Promise<any>`; createRemoteAppComponent's
    // signature accepts `Promise<any>` and extracts `module.default` at render
    // time. The bridge function returned by `createBridgeComponent` satisfies
    // that shape.
    loader: loader as () => Promise<{ default: unknown }>,
  })

export const REMOTES: readonly RemoteDefinition[] = [
  {
    id: 'remotePokemon',
    routeName: 'remote-pokemon',
    navLabel: 'Pokédex',
    basePath: '/pokemons',
    loadApp: async () => bridgeComponentFor(loadPokemonBridge),
  },
  {
    id: 'remoteDragonball',
    routeName: 'remote-dragonball',
    navLabel: 'Dragon Ball',
    basePath: '/dragon-ball',
    loadApp: async () => bridgeComponentFor(loadDragonballBridge),
  },
]
