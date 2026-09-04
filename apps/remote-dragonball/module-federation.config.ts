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
   * The public contract of this project — a RouteRecordRaw[] carrying the
   * character list and detail screens. Nothing from domain/, application/ or
   * infrastructure/ crosses this line: the host cannot reach the Character
   * entity, the use cases, the port, the adapter or the Awilix container.
   */
  exposes: {
    './routes': './src/modules/character/presentation/routes/character.routes.ts',
  },

  // Single source of truth for the singletons — see @pokedex/mf-shared. The
  // shell declares the exact same object, which is what guarantees one Vue,
  // one router and one Pinia on the page.
  shared: sharedSingletons,
})
