import type { createBridgeComponent } from '@module-federation/bridge-vue3'

/**
 * Stand-in for `remoteKpi/export-app` during host unit tests.
 *
 * See `remote-pokemon-export-app.ts` for the contract. Host tests only
 * assert route registration, never render the bridge.
 */
const bridge: ReturnType<typeof createBridgeComponent> = () => ({
  __APP_VERSION__: 'stub',
  async render(info) {
    if (info.dom) info.dom.textContent = 'list'
  },
  destroy() {
    // intentionally empty
  },
})

export default bridge
