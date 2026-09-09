import { createModuleFederationConfig } from '@module-federation/vite'
import { sharedSingletons } from '@pokedex/mf-shared'

export default createModuleFederationConfig({
  name: 'remoteKpi',
  filename: 'remoteEntry.js',
  manifest: true,

  // Igual que los demás remotes: la generación automática de .d.ts queda apagada
  // (el plugin delega en `tsc` plano, que no compila .vue/.css) y el contrato lo
  // declara a mano el host en src/modules/shared/types/remotes.d.ts.
  dts: false,

  /**
   * El contrato federado de este proyecto: una app Vue bridged (ADR 0005).
   *
   * Este remote porta el contenido de kpi-project. Lo que sí quedó en el host
   * es el chrome compartido — Header, MainNavbar y Breadcrumbs de kpi-project
   * se portaron al shell (PublicLayout) para que TODOS los remotes compartan la
   * misma navegación. Este remote queda dueño solo de su navegación interna:
   * SecondNavbar y el wrapper de card con tabs (MainLayout).
   *
   * Nada de api/ (mocks), services ni composables se expone: el hexágono
   * sigue sellado detrás de `./export-app`.
   */
  exposes: {
    './export-app': './src/export-app.ts',
  },

  // Single source of truth para los singletons — ver @pokedex/mf-shared.
  // El host declara exactamente el mismo objeto. Este remote no usa
  // @pinia/colada (los mocks son módulos locales), pero declara el contrato
  // completo igual que sus hermanos.
  shared: sharedSingletons,
})
