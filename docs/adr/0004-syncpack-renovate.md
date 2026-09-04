# ADR 0004 — Syncpack y Renovate para gobernar las dependencias del monorepo

- **Estado:** Aceptada
- **Fecha:** 2026-09-04
- **Contexto:** POC `pokedex-vuejs`, base técnica del microfrontend de PeopleFirst
- **Relacionadas:** [ADR 0001](0001-module-federation-en-monorepo.md),
  [ADR 0003 — pnpm](0003-pnpm.md), [Registro de riesgos](../riesgos.md)

---

## Contexto

El riesgo **R1** (acoplamiento de versiones entre host y remotes) tenía una mitigación a
medias. `packages/mf-shared/tests/shared-contract.spec.ts` verifica que el rango que declara
cada app esté **dentro** del `requiredVersion` federado:

```ts
semver.subset(declared, requiredVersion) // ^3.5.32 ⊆ ^3.5.0  ✓
```

Eso atrapa un caso: subir una app a Vue 4 dejando `requiredVersion: '^3.5.0'` mintiendo.
**No atrapa el caso simétrico**, que es más probable:

| app                 | declara       | ⊆ `^3.5.0`? |
| ------------------- | ------------- | ----------- |
| `host`              | `vue ^3.5.32` | ✓           |
| `remote-pokemon`    | `vue ^3.6.0`  | ✓           |
| `remote-dragonball` | `vue ^3.5.32` | ✓           |

Los tres pasan el guard. Los tres pasan el type-check, el lint y los unit tests. Y sin
embargo `remote-pokemon` puede resolver una versión de Vue que las otras dos no van a
resolver nunca: el `requiredVersion` es el mismo, pero la versión **instalada** difiere, y
Module Federation puede terminar con dos copias en la misma página. `inject()` no encuentra
nada, la reactividad se parte, y nada en el pipeline lo dijo.

Segundo problema, más aburrido pero igual de real: con un lockfile único
([R7](../riesgos.md#r7--lockfile-único-acopla-los-pipelines-🟠-mitigado)), los bumps de
dependencias sueltos son ruido. Y un bump que suba Vue en el host pero no en un remote
reintroduce el problema de arriba por la puerta de atrás.

## Decisión

Dos herramientas, cada una para un problema distinto.

### 1. Syncpack — consistencia entre workspaces, verificada en CI

```jsonc
// .syncpackrc.json
{
  "versionGroups": [
    {
      "label": "Singletons de Module Federation — el rango debe ser IDENTICO en todas las apps",
      "dependencies": ["vue", "vue-router", "pinia", "@pinia/colada"],
      "packages": ["**"],
    },
  ],
}
```

```jsonc
// package.json
"deps:check": "syncpack lint",   // ← corre en CI, antes de lint/tipos/tests
"deps:fix":   "syncpack fix"     // ← a mano, y se revisa lo que propone
```

**El detalle que casi me hace shipear un guard que no guardaba.** La primera versión de esta
config usaba `"policy": "sameRange"`, que suena a lo que se quiere y no lo es: `sameRange`
acepta rangos **compatibles**, y `^3.5.32` y `^3.6.0` se solapan, así que pasaba. Lo detecté
sólo porque probé el guard con un mismatch deliberado en vez de confiar en que un `✓ No
issues found` significaba algo:

```
$ syncpack lint                                    # con vue ^3.6.0 en remote-pokemon
= Singletons de Module Federation ============================================
   3x vue
      ✘ ^3.5.32 → ^3.6.0 in apps/host/package.json at .dependencies
      ✘ ^3.5.32 → ^3.6.0 in apps/remote-dragonball/package.json at .dependencies
✗ Issues found                                     # exit 1
```

Sin `policy`, el grupo usa el comportamiento por omisión (converger al semver más alto), que
exige rangos idénticos. **Moraleja aplicable a cualquier guard: un check que nunca viste
fallar no es un check, es una decoración.**

Los dos guards son complementarios y hay que tener los dos:

| Guard                     | Pregunta que responde                                       |
| ------------------------- | ----------------------------------------------------------- |
| `shared-contract.spec.ts` | ¿lo que declara cada app está dentro del `requiredVersion`? |
| `syncpack lint`           | ¿las tres apps declaran lo **mismo** entre sí?              |

`deps:check` **no pasa por Turborepo**: no es una tarea por paquete, es una comprobación
sobre el conjunto de los `package.json`. Meterla en el grafo la haría cachear por paquete,
que es justo lo contrario de lo que necesita.

### 2. Renovate — bumps agrupados por lo que se rompe junto

Lo valioso de `renovate.json` no es tener Renovate; es la **agrupación**. Los grupos están
definidos por _qué se rompe si se mueven por separado_, no por conveniencia:

| Grupo                       | Por qué van juntos                                                                   | Automerge |
| --------------------------- | ------------------------------------------------------------------------------------ | --------- |
| Singletons de MF            | Un PR que suba Vue en el host y no en un remote deja el contrato `shared` mintiendo  | **Nunca** |
| `@module-federation/**`     | Versiones distintas entre host y remotes cambian el formato del `remoteEntry`        | **Nunca** |
| Toolchain de build          | `vite`/`vitest`/plugins comparten API interna                                        | No        |
| TypeScript                  | `vue-tsc` rompe si `typescript` se mueve solo                                        | No        |
| Playwright                  | El paquete y el navegador tienen que corresponder                                    | No        |
| Lint y formato              | Ruido puro por separado                                                              | No        |
| Tooling del monorepo, patch | `turbo`, `syncpack`, `husky`, `lint-staged`: si rompe, lo dice el CI antes del merge | **Sí**    |
| Cualquier **major**         | Nunca se agrupa: cada uno con su PR, su revisión y aprobación en el dashboard        | Nunca     |

Los dos grupos marcados "Nunca" llevan además la etiqueta `mf-contract`, y los singletons
`revisar-requiredVersion`. La etiqueta es el recordatorio de que ese PR **no** se mergea sin
mirar `packages/mf-shared/src/index.ts` y sin correr el E2E contra builds.

`vulnerabilityAlerts` corre `at any time` — un CVE no espera al lunes. El resto va agendado
para la mañana del lunes, con `prConcurrentLimit: 3`, porque el objetivo es que alguien los
lea, no que se acumulen.

## Consecuencias

### A favor

- **R1 pasa de "Vigilado" a "Mitigado".** Ya no depende de que alguien se acuerde: un rango
  divergente entre apps rompe el CI.
- El agrupamiento convierte los bumps en decisiones revisables y no en un goteo de PRs.
- Las etiquetas `mf-contract` / `revisar-requiredVersion` hacen visible en el PR cuál es el
  riesgo, sin que haya que reconstruirlo de memoria.
- `syncpack fix` arregla el mismatch, pero **propone** — converger al semver más alto es una
  heurística, no la respuesta. La decisión sigue siendo del humano.

### En contra

- **Dos herramientas más.** Syncpack se paga solo (una config de 8 líneas y un check en CI);
  Renovate requiere habilitar la app de GitHub en el repo y atender el dashboard.
- **Un check más en el camino crítico del CI.** Corre en ~1 s antes del resto.
- **Renovate puede volverse ruido si nadie lo atiende.** Mitigado con `prConcurrentLimit: 3`
  y agenda semanal, pero es un compromiso de proceso, no solo de config. Si en un mes nadie
  mira el dashboard, la respuesta correcta es apagarlo, no ignorarlo.

### Lo que esto NO resuelve

- **No sustituye al E2E contra builds.** Que las tres apps declaren el mismo rango no prueba
  que en la página haya una sola instancia. Eso lo prueba `pnpm test:e2e:preview`
  ([R8](../riesgos.md#r8--el-dev-server-no-ejercita-el-contrato-shared-🔴-mitigado)).
- **No cubre dependencias transitivas.** Syncpack lee los `package.json`, no el árbol
  resuelto. Dos versiones de una transitiva compartida siguen siendo posibles; para eso está
  `pnpm dedupe` y, si llegara a importar, `pnpm.overrides`.

## Alternativas consideradas

| Alternativa                                  | Evaluación                                                                                                                                                                                   |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Solo el guard de `mf-shared`**             | Es lo que había. Deja pasar el caso de rangos divergentes entre apps, que es el más probable de los dos.                                                                                     |
| **Dependabot en vez de Renovate**            | No agrupa por reglas arbitrarias ni entiende bien workspaces de pnpm. La agrupación **es** el valor acá, así que Dependabot no compra el problema resuelto.                                  |
| **`pnpm.overrides` para forzar una versión** | Fuerza el árbol resuelto pero deja los `package.json` mintiendo, y en MF lo que se negocia es el rango declarado. Escondería el problema en vez de mostrarlo.                                |
| **Extender el guard de `mf-shared`**         | Se podría agregar un test que compare los rangos entre apps. Es ~20 líneas y una dependencia menos — pero Syncpack cubre además el resto de las dependencias, no solo los cuatro singletons. |
| **Changesets**                               | Resuelve versionado y publicación de paquetes. Acá no se publica nada: las apps son privadas y `mf-shared` es interno. No aplica.                                                            |

## Verificación

```
$ pnpm deps:check                          → ✓ No issues found (exit 0)
$ # con vue ^3.6.0 en remote-pokemon:
$ pnpm deps:check                          → ✗ Issues found (exit 1)
$ turbo run lint type-check test build     → 14/14
$ turbo run //#smoke                       → 27 comprobaciones
```

El guard se probó **fallando**, no solo pasando. Es la única forma de saber que sirve.

**Pendiente, y requiere acción fuera del repo:** habilitar la app de Renovate en
`tsalinasdev/poc-monorepo-mf` (o en la organización). Hasta entonces `renovate.json` es
documentación de la intención, no un bot corriendo.

## Referencias

- [Syncpack — Version Groups](https://syncpack.dev/config/version-groups/) _(la página de
  configuración no pudo consultarse durante esta migración; el comportamiento por omisión de
  los grupos se determinó empíricamente, probando el guard con un mismatch deliberado)_
- [Renovate — Package Rules](https://docs.renovatebot.com/configuration-options/#packagerules)
- `packages/mf-shared/tests/shared-contract.spec.ts` — el guard complementario
