# ADR 0005 — Bridge/manifest como contrato federado

- **Estado:** Aceptada
- **Fecha:** 2026-09-07
- **Contexto:** POC `pokedex-vuejs`, base técnica del microfrontend de PeopleFirst
- **Reemplaza a:** —
- **Relacionadas:** [ADR 0001 — Module Federation en monorepo](0001-module-federation-en-monorepo.md),
  [Plan de implementación](../plan-implementacion-peoplefirst.md) §3.1 y §1.4.9,
  [Riesgos](../riesgos.md) R6 y R22

---

## Contexto

La POC `pokedex-vuejs` se construyó con un contrato mínimo: cada remote expone un
`RouteRecordRaw[]` y el host lo monta como hijos de su layout. Esa elección está bien para
validar la mecánica (singletons, degradación, fallback, e2e contra builds), pero la
**decisión abierta #3** del plan (contrato: `RouteRecordRaw[]` vs `createBridgeComponent`) y
el riesgo **R22** (deriva entre POC y planificación) la dejaban sin cerrar. La POC vivía con
una hipótesis que la planificación rechazaba.

Hay dos costos concretos con el contrato actual que esta decisión cierra:

1. **El host hace `import()` de `remoteEntry.js` directamente.** Eso obliga al runtime de MF
   a inicializar el remote apenas el `import()` resuelve, ejecutar su `init(shareScope)` y
   negociar todos los `shared` antes de que sepamos si el remote siquiera expone la ruta que
   queremos. El `mf-manifest.json` ya existe en cada build (el plugin `manifest: true` lo
   emite), pero no se usa. Cargar el manifest primero da:
   - **Una sola request de descubrimiento** antes de comprometerse con el runtime del remote.
   - **Información de versionado y compatibilidad** sin ejecutar el remote.
   - **Pre-carga selectiva**: el runtime puede leer el manifest y pedir _solo_ los chunks
     necesarios para el módulo que se va a renderizar, no todo el remote.

2. **El remote expone rutas, no una App.** Eso significa que el router del host y el router
   del remote son **dos routers distintos hablando entre sí por `_router.push(...)`**. En
   la POC funciona porque los singletons están bien negociados, pero la **integración es
   superficial**: el remote no controla su ciclo de vida (mount/unmount, plugins que solo
   existen dentro del remote, estado de scoped CSS al subtree). El bridge de
   `@module-federation/bridge-vue3` existe exactamente para esto: el remote expone **una App
   completa** (con su router, sus plugins, su ciclo de vida) y el host la monta con un único
   punto de entrada que recibe `basename` y opcionalmente `memoryRoute`.

La combinación de ambos cambios hace que el remote deje de ser "una lista de rutas
serializadas" y pase a ser **una mini-aplicación federada**. El host se vuelve un verdadero
shell, no un router que digiere rutas ajenas.

## Decisión

**Cada remote expone una sola cosa: `./export-app`, una `createBridgeComponent(...)` de
`@module-federation/bridge-vue3` que envuelve su `App` + router. El host carga cada remote
vía `mf-manifest.json` y lo monta con `createRemoteAppComponent` de la misma librería.**

```ts
// apps/remote-pokemon/src/export-app.ts
import { createBridgeComponent } from '@module-federation/bridge-vue3'
import App from './App.vue'
import router from './router'

export default createBridgeComponent({
  rootComponent: App,
  appOptions: ({ app }) => {
    // Plugins que solo viven dentro del remote (ej. un plugin de feature flags)
    return { router }
  },
})
```

```ts
// apps/host/src/base/config/router/remotes.ts
import { loadRemote } from '@module-federation/runtime'
import { createRemoteAppComponent } from '@module-federation/bridge-vue3'

const RemotePokemon = createRemoteAppComponent({
  loader: () => loadRemote('remotePokemon/export-app'),
})

export const REMOTES = [
  {
    id: 'remotePokemon',
    navLabel: 'Pokédex',
    basePath: '/pokemons',
    loadApp: () => RemotePokemon,
  },
  // ...
]
```

```ts
// apps/host/module-federation.config.ts
remotes: {
  remotePokemon:    'remotePokemon@http://localhost:5174/mf-manifest.json',
  remoteDragonball: 'remoteDragonball@http://localhost:5175/mf-manifest.json',
}
```

El **router del host** monta cada remote como un único `component` en una ruta catch-all de
su sección:

```ts
{ path: '/pokemons/:pathMatch(.*)*', component: RemotePokemon, props: { basename: '/pokemons' } }
{ path: '/dragon-ball/:pathMatch(.*)*', component: RemoteDragonball, props: { basename: '/dragon-ball' } }
```

El `basename` se pasa al bridge para que el router del remote construya sus URLs internas
relativas a la sección del host. El remote sigue siendo dueño de su navegación interna.

### Lo que cambia en cada capa

| Capa                    | Antes (POC)                                               | Ahora                                                                           |
| ----------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Remote `exposes`        | `./routes` → `RouteRecordRaw[]`                           | `./export-app` → `createBridgeComponent(...)`                                   |
| Remote router           | Se monta en `main.ts` standalone; **no se carga en host** | Sigue standalone; **además** se carga dentro del bridge cuando el host lo monta |
| Host `remotes` (config) | `entry: '<url>/remoteEntry.js'`                           | `entry: '<url>/mf-manifest.json'`                                               |
| Host routing            | `...pokemonRoutes` como children                          | Un componente bridged por remote en una ruta catch-all                          |
| Host `navLabel`         | Derivado de `meta.navLabel` en las rutas                  | Hardcodeado en `RemoteDefinition` (catálogo del host)                           |
| Build                   | `mf-manifest.json` se emite pero no se usa                | `mf-manifest.json` se emite **y** se consume como punto de entrada              |
| `appOptions` del bridge | n/a                                                       | Plugins que el remote necesite _dentro_ de su App (sin contaminar el host)      |
| Estilos por sección     | `meta` + CSS que viaja con el remote                      | Idéntico: el módulo expuesto sigue importando `@/assets/main.css`               |

### El catálogo del host (lo que era "fallback degradado" pasa a ser la fuente)

```ts
// apps/host/src/base/config/router/remotes.ts
export interface RemoteDefinition {
  id: string
  navLabel: string // fuente de verdad del label en la barra
  basePath: string // sección del host donde se monta el remote
  loadApp: () => Promise<unknown> // bridge component, lazy
}
```

El host mantiene este catálogo **como código**, no como config en runtime. La razón:
`navLabel` es un problema de UX que depende del host (idioma, orden, copy), no del remote.
El manifest no debe definir el label. Lo único que el host consulta al manifest es la lista
de módulos disponibles y sus versiones — eso es problema del runtime de MF.

### Consecuencias operativas

- **Costo de migración**: medio. Toca `apps/remote-pokemon` y `apps/remote-dragonball`
  (nuevo `src/export-app.ts`, cambio en `module-federation.config.ts`) y `apps/host`
  (cambio en catálogo, router, MF config, `types/remotes.d.ts`). Los tests unit del hexágono
  no se tocan. El e2e cambia el stub: pasa de stubear `RouteRecordRaw[]` a stubear un
  componente.
- **Plugins del remote** que antes vivían "en el host pero solo para este remote" ahora
  pueden vivir en el remote vía `appOptions`. Eso _reduce_ superficie del host.
- **`mf-manifest.json` pasa a ser el contrato de despliegue**. Lo que cambia entre
  entornos es la URL del manifest, no la URL del entry. Eso encaja limpio con la sección
  [1.4.9 del plan](../plan-implementacion-peoplefirst.md#149-resolución-de-remotes-en-runtime):
  el `remotes.json` que el plan proponía se reemplaza por el propio manifest, que el host
  puede fetchear con `registerRemotes` en runtime.
- **Versiones** — `@module-federation/bridge-vue3@^2.7` y
  `@module-federation/runtime@^2.x` (los que `@module-federation/vite@^1.21` ya trae como
  pares).
- **Node y pnpm** (no arquitectural pero cerrado acá para no abrir un ADR chico aparte):
  - `engines.node`: `>=22.0.0 <25.0.0` (el rango 22–24 que pidió el equipo).
  - `packageManager`: `pnpm@10.x` se mantiene en la POC hasta validar pnpm 12 en una rama
    de prueba; bumpear `packageManager` antes de medir bloquea el repo a quien todavía
    tenga pnpm 10 local.

## Alternativas consideradas

| Alternativa                                           | Por qué no                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Quedarse con `RouteRecordRaw[]` (estado anterior)** | El host se acopla al router del remote vía singletons compartidos. Funciona, pero el remote no controla su ciclo de vida: el host no puede desmontarlo limpio, ni pasarle plugins scoped.                                                                                    |
| **`createBridgeComponent` sin manifest**              | El remote expone la App bridged, pero el host sigue cargando `remoteEntry.js`. Mantiene el problema 1 (request innecesaria al runtime del remote antes de saber si lo necesitamos).                                                                                          |
| **Web Components como contrato**                      | Sirve para el caso táctico del módulo KPI (sin JWT), no como contrato general: rompe singletons, rompe router compartido, no negocia `shared`. Lo dejamos donde ya está en [Fase 4.6](../plan-implementacion-peoplefirst.md#46-la-vía-web-component-paralela-no-secuencial). |
| **iframe por remote**                                 | Aislamiento real, pero rompe accesibilidad, foco, compartir sesión y router. Es la bala de plata que no compensa acá.                                                                                                                                                        |

## Reversión (umbrales explícitos para revisar la decisión)

Esta decisión se revisa si se cumple **cualquiera** de:

- El bridge requiere knowledge del host que rompe la autonomía del remote (ej. necesita el
  `pinia` instance del host para funcionar): el `createBridgeComponent` se está usando mal.
- La latencia de carga del manifest + remote supera la del `remoteEntry.js` directo en un
  20% sostenido (medido en e2e contra builds): la promesa de "manifest primero" no se
  cumple.
- `@module-federation/bridge-vue3` deja de mantenerse o se discontinúa: revertimos a
  `RouteRecordRaw[]` y reabrimos decisión abierta #3.

## Referencias

- [Vue Bridge (for Vue v3) — Module Federation](https://module-federation.io/integrations/practice/vue.html)
- [Runtime API — Module Federation](https://module-federation.io/guide/runtime/runtime-api)
- [manifest — Module Federation](https://module-federation.io/configure/manifest)
- `apps/host/src/base/config/router/remotes.ts` — el catálogo que el host mantiene
- `apps/remote-pokemon/src/export-app.ts` — el `createBridgeComponent` del remote
- `apps/host/src/types/remotes.d.ts` — la superficie de tipos del contrato
