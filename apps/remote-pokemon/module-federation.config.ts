import { createModuleFederationConfig } from '@module-federation/vite'
import { sharedSingletons } from '@pokedex/mf-shared'

export default createModuleFederationConfig({
  name: 'remotePokemon',
  filename: 'remoteEntry.js',
  manifest: true,

  // Automatic .d.ts generation is off: it shells out to plain `tsc`, which
  // cannot compile the .vue and .css files this entry pulls in. The contract is
  // declared by hand in the host (src/types/remotes.d.ts) so it stays small,
  // reviewed, and independent of the remote's internals.
  dts: false,

  /**
   * The public contract of this project — the federated equivalent of a
   * backend's REST API. It is deliberately a single presentation artifact:
   * a bridged Vue application that the host mounts as one catch-all route
   * per section.
   *
   * `createBridgeComponent` (`@module-federation/bridge-vue3`) lets the
   * remote own its full lifecycle — its router, its Pinia, its plugins —
   * while the host stays a thin shell. See ADR 0005 for the reasoning.
   *
   * Nothing from domain/, application/ or infrastructure/ is exposed. The host
   * cannot import a Pokemon entity, a use case, a port or the Awilix container,
   * so this hexagon stays sealed and free to change behind the contract.
   */
  exposes: {
    './export-app': './src/export-app.ts',
  },

  // Single source of truth for the singletons — see @pokedex/mf-shared. The
  // shell declares the exact same object, which is what guarantees one Vue,
  // one router and one Pinia on the page.
  shared: sharedSingletons,
})
