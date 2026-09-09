import type { Component } from 'vue'
import { createRemoteAppComponent } from '@module-federation/bridge-vue3'

export interface RemoteDefinition {
  /** Matches the name in module-federation.config.ts — used in diagnostics. */
  id: string
  /** Vue Router name for the section catch-all route. */
  routeName: string
  /** Label rendered in the navbar. Host-owned copy. */
  navLabel: string
  /**
   * Marks the section with a dropdown chevron in the shell navbar (visual
   * affordance of the PeopleFirst design, ported from kpi-project). No
   * dropdown content yet — purely presentational.
   */
  hasDropdown?: boolean
  /** Section path; the bridge derives its `basename` from the matched route. */
  basePath: string
  loadApp: () => Promise<Component>
}

// The import specifier must be a string literal: the MF Vite plugin only
// rewrites `import()` calls that match a configured remote. One loader per
// remote; adding a remote = one loader + one entry below.
const loadDragonballBridge = () => import('remoteDragonball/export-app')
const loadKpiBridge = () => import('remoteKpi/export-app')

// The eager `await loader()` surfaces a down remote to Promise.allSettled in
// registerRemoteRoutes: createRemoteAppComponent alone defers the load to
// mount time. The MF runtime caches the module, so the deferred load is free.
async function loadBridgeApp(loader: () => Promise<unknown>): Promise<Component> {
  await loader()
  return createRemoteAppComponent({ loader })
}

export const REMOTES: readonly RemoteDefinition[] = [
  {
    // El contenido de kpi-project portado como remote (cierre de la POC
    // PeopleFirst). Su navegación interna (SecondNavbar, tabs) vive dentro
    // del remote; el chrome compartido (Header/MainNavbar/Breadcrumbs) vive
    // aquí, en el shell. Es la primera entrada del catálogo: el redirect del
    // `'/'` del shell lleva a esta sección.
    id: 'remoteKpi',
    routeName: 'remote-kpi',
    navLabel: 'Gestión KPI',
    basePath: '/gestion-kpi',
    loadApp: () => loadBridgeApp(loadKpiBridge),
  },
  {
    id: 'remoteDragonball',
    routeName: 'remote-dragonball',
    navLabel: 'Dragon Ball',
    basePath: '/dragon-ball',
    loadApp: () => loadBridgeApp(loadDragonballBridge),
  },
]
