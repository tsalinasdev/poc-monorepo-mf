/**
 * Type surface of every federated module the host consumes.
 *
 * This is the ONLY place the host knows anything about a remote, and it is
 * deliberately narrow: a bridged Vue application. No domain entity, use case,
 * port or adapter type crosses this line — each remote's internals stay inside
 * it. See ADR 0005 for why the contract changed from `RouteRecordRaw[]` to
 * `createBridgeComponent`.
 */
declare module 'remoteDragonball/export-app' {
  import type { createBridgeComponent } from '@module-federation/bridge-vue3'

  const bridge: ReturnType<typeof createBridgeComponent>
  export default bridge
}

declare module 'remoteKpi/export-app' {
  import type { createBridgeComponent } from '@module-federation/bridge-vue3'

  const bridge: ReturnType<typeof createBridgeComponent>
  export default bridge
}
