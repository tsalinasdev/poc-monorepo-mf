import { createModuleFederationConfig } from '@module-federation/vite'
import { sharedSingletons } from '@pokedex/mf-shared'

export interface RemoteManifestUrls {
  remoteDragonball: string
  remoteKpi: string
}

/**
 * Remote entry URLs are deploy-time values (localhost in dev, bucket/CDN URLs in
 * production), so the config is a factory instead of a static object.
 *
 * The `entry` of each remote is its **`mf-manifest.json`**, not `remoteEntry.js`.
 * The runtime (`@module-federation/runtime`) reads the manifest first to learn
 * what modules the remote exposes and from which chunks, and only then pulls
 * the bytes needed for the specific expose — `./export-app` per remote. This is
 * cheaper and faster than `import`-ing `remoteEntry.js` blindly. See ADR 0005.
 */
export function createHostFederationConfig(manifestUrls: RemoteManifestUrls) {
  return createModuleFederationConfig({
    name: 'host',
    filename: 'remoteEntry.js',
    // The remotes publish no generated types; the host declares every contract
    // itself in src/modules/shared/types/remotes.d.ts.
    dts: false,
    remotes: {
      // The Vite plugin understands the `<name>@<url>` shorthand: the runtime
      // fetches `<url>` (here, the remote's mf-manifest.json) and resolves the
      // remote's exposes from it. See ADR 0005.
      remoteDragonball: `remoteDragonball@${manifestUrls.remoteDragonball}`,
      remoteKpi: `remoteKpi@${manifestUrls.remoteKpi}`,
    },
    // Single source of truth for the singletons — see @pokedex/mf-shared.
    shared: sharedSingletons,
  })
}
