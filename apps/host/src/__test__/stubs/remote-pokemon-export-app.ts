import type { createBridgeComponent } from '@module-federation/bridge-vue3'

/**
 * Stand-in for `remotePokemon/export-app` during host unit tests.
 *
 * After ADR 0005 the contract is `createBridgeComponent(...)`: the remote
 * exports a bridge function (the default export) that returns `{ render,
 * destroy }`. The host wraps it via `createRemoteAppComponent`
 * (`@module-federation/bridge-vue3`) and mounts the result.
 *
 * The stub's `render` paints a marker into the DOM element the host provides
 * so route-resolution tests can assert that the bridge ended up mounted
 * inside the shell. Real rendering of the remote's UI is covered by the
 * e2e against builds.
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
