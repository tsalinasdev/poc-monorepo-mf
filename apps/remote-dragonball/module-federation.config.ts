import { createModuleFederationConfig } from '@module-federation/vite'
import { sharedSingletons } from '@pokedex/mf-shared'

export default createModuleFederationConfig({
  name: 'remoteDragonball',
  filename: 'remoteEntry.js',
  manifest: true,

  // Same reason as the pokemon remote: the automatic DTS step shells out to
  // plain `tsc`, which cannot compile the .vue and .css files this entry pulls
  // in. The contract is declared by hand in the host (src/types/remotes.d.ts).
  dts: false,

  /**
   * The public contract of this project — a bridged Vue application that the
   * host mounts as one catch-all route per section. `createBridgeComponent`
   * (`@module-federation/bridge-vue3`) gives the remote ownership of its
   * router, plugins and lifecycle; the host stays a thin shell. See ADR 0005.
   *
   * Nothing from domain/, application/ or infrastructure/ crosses this line:
   * the host cannot reach the Character entity, the use cases, the port, the
   * adapter or the Awilix container.
   */
  exposes: {
    './export-app': './src/export-app.ts',
  },

  // Single source of truth for the singletons — see @pokedex/mf-shared. The
  // shell declares the exact same object, which is what guarantees one Vue,
  // one router and one Pinia on the page.
  shared: sharedSingletons,
})
