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
   * a RouteRecordRaw[] carrying the list and detail screens.
   *
   * Nothing from domain/, application/ or infrastructure/ is exposed. The host
   * cannot import a Pokemon entity, a use case, a port or the Awilix container,
   * so this hexagon stays sealed and free to change behind the contract.
   */
  exposes: {
    './routes': './src/modules/pokemon/presentation/routes/pokemon.routes.ts',
  },

  // Single source of truth for the singletons — see @pokedex/mf-shared. The
  // shell declares the exact same object, which is what guarantees one Vue,
  // one router and one Pinia on the page.
  shared: sharedSingletons,
})
