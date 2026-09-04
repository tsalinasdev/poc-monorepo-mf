import { createModuleFederationConfig } from '@module-federation/vite'
import { sharedSingletons } from '@pokedex/mf-shared'

export interface RemoteEntries {
  remotePokemon: string
  remoteDragonball: string
}

/**
 * Remote entry URLs are deploy-time values (localhost in dev, bucket/CDN URLs in
 * production), so the config is a factory instead of a static object.
 */
export function createHostFederationConfig(entries: RemoteEntries) {
  return createModuleFederationConfig({
    name: 'host',
    filename: 'remoteEntry.js',
    // The remotes publish no generated types; the host declares every contract
    // itself in src/types/remotes.d.ts.
    dts: false,
    remotes: {
      remotePokemon: {
        type: 'module',
        name: 'remotePokemon',
        entry: entries.remotePokemon,
      },
      remoteDragonball: {
        type: 'module',
        name: 'remoteDragonball',
        entry: entries.remoteDragonball,
      },
    },
    // Single source of truth for the singletons — see @pokedex/mf-shared.
    shared: sharedSingletons,
  })
}
