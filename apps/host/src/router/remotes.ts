import type { Component } from 'vue'
import { createRemoteAppComponent } from '@module-federation/bridge-vue3'

export interface RemoteDefinition {
  /** Matches the name in module-federation.config.ts — used in diagnostics. */
  id: string
  /** Vue Router name for the section catch-all route. */
  routeName: string
  /** Label rendered in the navbar. Host-owned copy. */
  navLabel: string
  /** Section path; the bridge derives its `basename` from the matched route. */
  basePath: string
  loadApp: () => Promise<Component>
}

// The import specifier must be a string literal: the MF Vite plugin only
// rewrites `import()` calls that match a configured remote. One loader per
// remote; adding a remote = one loader + one entry below.
const loadPokemonBridge = () => import('remotePokemon/export-app')
const loadDragonballBridge = () => import('remoteDragonball/export-app')

// The eager `await loader()` surfaces a down remote to Promise.allSettled in
// registerRemoteRoutes: createRemoteAppComponent alone defers the load to
// mount time. The MF runtime caches the module, so the deferred load is free.
async function loadBridgeApp(loader: () => Promise<unknown>): Promise<Component> {
  await loader()
  return createRemoteAppComponent({ loader })
}

export const REMOTES: readonly RemoteDefinition[] = [
  {
    id: 'remotePokemon',
    routeName: 'remote-pokemon',
    navLabel: 'Pokédex',
    basePath: '/pokemons',
    loadApp: () => loadBridgeApp(loadPokemonBridge),
  },
  {
    id: 'remoteDragonball',
    routeName: 'remote-dragonball',
    navLabel: 'Dragon Ball',
    basePath: '/dragon-ball',
    loadApp: () => loadBridgeApp(loadDragonballBridge),
  },
]
