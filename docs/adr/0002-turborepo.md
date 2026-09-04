# ADR 0002 — Turborepo como orquestador de tareas del monorepo

- **Estado:** Aceptada
- **Fecha:** 2026-09-04
- **Contexto:** POC `pokedex-vuejs`, base técnica del microfrontend de PeopleFirst
- **Relacionadas:** [ADR 0001 — MF en monorepo](0001-module-federation-en-monorepo.md), [ADR 0003 — pnpm](0003-pnpm.md),
  [Registro de riesgos](../riesgos.md)

---

## Contexto

El [ADR 0001](0001-module-federation-en-monorepo.md) eligió monorepo por mantenibilidad.
Ese beneficio viene con un costo mecánico concreto, que era el riesgo **R2** de la
presentación al equipo:

> Sin cache ni filtrado, cada push rebuildea y retestea **todo** el monorepo aunque el
> cambio toque una sola app.

Con la orquestación anterior (`npm run test --workspaces --if-present`) eso era literal:

```jsonc
// antes
"build": "npm run build --workspace remote-pokemon && npm run build --workspace remote-dragonball && npm run build --workspace host",
"test": "npm run test --workspaces --if-present",
"lint": "npm run lint --workspaces --if-present",
"type-check": "npm run type-check --workspaces --if-present"
```

Tres problemas, no uno:

1. **Sin cache.** Un cambio de una línea en `remote-dragonball` volvía a correr los 8 tests
   de `remote-pokemon`, su type-check y su lint. Con 3 apps es molesto; con 8 dominios de
   PeopleFirst (Reconocimientos, Clima, KPI, …) es un cuello de botella de entrega.
2. **Orden encadenado a mano.** El `&&` del script de `build` codificaba un orden en un
   string. Nadie recuerda actualizarlo al agregar el cuarto remote, y el error se manifiesta
   como un build verde con artefactos incompletos.
3. **`type-check` escondido dentro de `build`.** Cada app hacía
   `run-p type-check "build-only {@}"`, así que no había forma de cachear el chequeo de tipos
   por separado: tocar un test invalidaba el build entero.

## Decisión

**Turborepo 2.x** como orquestador. `turbo.json` es la única fuente del grafo de tareas y
los scripts raíz pasan a ser delegaciones de una línea.

### El grafo, explícito

```
@pokedex/mf-shared#type-check
        ├──▶ host#type-check ──────────▶ host#build ─────────┐
        ├──▶ remote-pokemon#type-check ─▶ remote-pokemon#build ┤
        └──▶ remote-dragonball#…      ─▶ remote-dragonball#build┤
                                                               └──▶ host#test:e2e:preview
```

Verificable en cualquier momento:

```bash
pnpm exec turbo run test:e2e:preview --dry-run=text   # el grafo en texto
pnpm graph                                            # el grafo en imagen
```

### Las tres decisiones de diseño que importan

**1. El build del host NO depende del build de los remotes.**

Tentador y equivocado. En Module Federation el host solo hornea la URL del
`remoteEntry.js`; no consume el artefacto del remote. Encadenar
`host#build → remote-*#build` reintroduciría por la puerta de atrás el acoplamiento de
despliegue que MF existe para evitar, y haría que publicar Dragon Ball obligue a rebuildear
Pokémon.

`dependsOn: ["^build"]` es **topológico**: espera solo a las dependencias de workspace
reales de cada app (hoy `@pokedex/mf-shared`).

El fan-out explícito a los tres builds vive donde de verdad hace falta: en la suite E2E,
que necesita los tres `dist/` porque Playwright los sirve en tres puertos.

```jsonc
"host#test:e2e:preview": {
  "dependsOn": ["build", "remote-pokemon#build", "remote-dragonball#build"],
  "cache": false
}
```

**2. Las variables de entorno del build están declaradas. Esto no es cosmético.**

```jsonc
"build": {
  "env": ["VITE_PUBLIC_PATH", "VITE_API_BASE_URL",
          "VITE_REMOTE_POKEMON_ENTRY", "VITE_REMOTE_DRAGONBALL_ENTRY"]
}
```

`VITE_PUBLIC_PATH` se convierte en el `base` de Vite y queda **dentro** del bundle. Si no
estuviera en `env`, turbo consideraría idénticos dos builds con URLs de CDN distintas y
devolvería el cacheado. El síntoma sería un remote desplegado a producción pidiendo sus
chunks al bucket de staging: 404 en runtime, CI en verde.

Es el modo de fallo más peligroso que introduce el cache, y la mitigación es una lista de
cuatro strings. Cada variable nueva que entre a un bundle **tiene que** agregarse acá.
→ Riesgo **R12**.

**3. `lint` no lleva `--fix`.**

Una tarea cacheada no debe mutar el fuente: con `--fix`, un cache hit saltaría los arreglos
y el árbol de trabajo quedaría distinto según si el cache acertó o no. El `--fix` se movió a
`lint:fix`, que corre a mano y por `lint-staged` en el pre-commit, y no pasa por turbo.

### El guard de contrato necesita inputs explícitos

`packages/mf-shared/tests/shared-contract.spec.ts` verifica que el `requiredVersion`
declarado siga siendo superconjunto de lo que cada app instala — y para eso **lee los
`package.json` de las tres apps**, que están fuera de su propio paquete.

Turbo hashea por defecto solo los archivos del paquete. Sin declararlo, subir el host a
Vue 4 dejaría el guard en cache y en verde, que es exactamente el fallo que el guard existe
para atrapar:

```jsonc
"@pokedex/mf-shared#test": {
  "inputs": ["$TURBO_DEFAULT$",
             "../../apps/host/package.json",
             "../../apps/remote-pokemon/package.json",
             "../../apps/remote-dragonball/package.json"]
}
```

## Resultados medidos en la POC

```
$ turbo run lint type-check test        # frío
 Tasks:    11 successful, 11 total
Cached:    0 cached, 11 total
  Time:    31.575s

$ turbo run lint type-check test        # sin cambios
 Tasks:    11 successful, 11 total
Cached:    8 cached, 11 total
  Time:    13.531s

$ turbo run build                       # type-check ya cacheado
 Tasks:    7 successful, 7 total
Cached:    4 cached, 7 total
  Time:    2.63s
```

Con 3 apps el ahorro es de segundos. El punto no es el número de hoy: es que el número
**no crece** con la cantidad de remotes, porque solo se recomputa lo que cambió. En
PeopleFirst, con un remote por dominio migrado del monolito, esa es la diferencia entre un
CI de minutos y un CI de media hora.

## Alternativas consideradas

| Alternativa                      | Evaluación                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nx**                           | Más potente: grafo por imports (no solo por `package.json`), generadores, `nx affected` más fino y **soporte first-class de Module Federation** — pero ese soporte es para **Webpack/Rspack**, y esta POC federa con `@module-federation/vite`. Los generadores de MF de Nx no aplican, así que quedaría el costo conceptual de Nx sin su mayor beneficio. |
| **`npm run … --workspaces`**     | El punto de partida. Sin cache, sin grafo, orden en un string. Es el riesgo R2 sin mitigar.                                                                                                                                                                                                                                                                |
| **pnpm workspaces + `--filter`** | Filtra por paquete y por cambios, pero **no cachea** resultados de tareas. Resuelve la mitad del problema. Compatible con Turborepo si más adelante se migra a pnpm (ver "Decisiones pendientes" abajo).                                                                                                                                                   |
| **Solo scripts de bash**         | Reimplementar hash de inputs y cache correctamente es más trabajo, y más frágil, que un `turbo.json` de 120 líneas.                                                                                                                                                                                                                                        |

**Cuándo reconsiderar Nx:** si PeopleFirst migra la federación a Rsbuild/Rspack (la
planificación original lo contemplaba antes de unificar en Vite), el soporte MF de Nx pasa
a ser un beneficio real y este ADR debe revisarse.

## Consecuencias

### A favor

- Un cambio en una app no recomputa el trabajo de las otras.
- El orden de tareas es un grafo declarado e inspeccionable, no un `&&` en un string.
- `type-check` cachea por separado de `build`.
- `pnpm affected` corre solo lo tocado respecto de la base — útil en local antes de
  abrir el PR.
- La configuración de CI se reduce a `pnpm exec turbo run …` más un `actions/cache` de `.turbo`.

### En contra

- **Una herramienta más que aprender.** Mitigado porque los scripts raíz siguen llamándose
  igual (`pnpm dev`, `pnpm test`, `pnpm build`): quien no quiera saber de turbo no
  necesita saberlo.
- **El cache puede mentir si `inputs`/`env` están mal declarados.** Riesgo **R12**, con la
  mitigación descrita arriba. Escotilla de emergencia: `turbo run … --force`.
- **Dependencia de un proveedor para el Remote Cache.** El cache local y el de GitHub
  Actions no dependen de nadie; el Remote Cache compartido sí (Vercel, o
  [un servidor propio compatible](https://turborepo.com/docs/core-concepts/remote-caching#self-hosting)).

## Estado y pasos siguientes

- [x] `turbo.json` con el grafo de `build`, `type-check`, `lint`, `test`, `test:e2e*`, `dev`, `preview`
- [x] Scripts raíz delegados a turbo, conservando los nombres previos
- [x] `env` del build declarado (evita cache envenenado con URLs equivocadas)
- [x] `inputs` cruzados del guard de contrato de `mf-shared`
- [x] CI con `actions/cache` sobre `.turbo`, por rama y con fallback a `main`
- [x] `.turbo` en `.gitignore`
- [ ] **Remote Cache compartido.** Hoy el cache es por runner y por rama. Compartirlo entre
      CI y las máquinas del equipo requiere `TURBO_TOKEN`/`TURBO_TEAM` y, en un cache
      compartido, **firma de artefactos** (`remoteCache.signature: true` +
      `TURBO_REMOTE_CACHE_SIGNATURE_KEY`): sin firma, quien pueda escribir en el cache puede
      entregar artefactos arbitrarios al pipeline. → Riesgo **R13**.
- [ ] **`--affected` en CI.** Deliberadamente fuera por ahora: con 3 apps el cache ya da el
      ahorro, y `--affected` agrega la posibilidad de saltarse un check por un diff mal
      calculado. Se activa cuando el CI en frío pase de ~10 min.

## Decisiones que estaban pendientes y ya se cerraron

| Tema               | Estado inicial                                  | Resolución                                                          |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------------------- |
| Gestor de paquetes | npm workspaces (`packageManager: npm@10.9.8`)   | **pnpm 10** — ver [ADR 0003](0003-pnpm.md)                          |
| Lockfiles          | Conviven `package-lock.json` y `pnpm-lock.yaml` | Solo `pnpm-lock.yaml`. Riesgo R11 **resuelto**                      |
| Versión de Node    | `^20.19.0 \|\| >=22.12.0`                       | Sigue abierta: alinear con lo que pida SRE (`> 22.18.0` en el plan) |

Turborepo es agnóstico al gestor de paquetes: el cambio a pnpm solo movió las invocaciones de
`npx turbo` a `pnpm exec turbo` y el paso de instalación del CI.

## Referencias

- [Turborepo — Configuring tasks](https://turborepo.com/docs/crafting-your-repository/configuring-tasks)
- [Turborepo — Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Turborepo — Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Nx — Module Federation](https://nx.dev/docs/technologies/module-federation)
- `turbo.json` — la configuración, con su razonamiento inline
