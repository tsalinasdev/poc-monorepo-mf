# ADR 0001 — Module Federation dentro de un monorepo

- **Estado:** Aceptada
- **Fecha:** 2026-09-04
- **Contexto:** POC `pokedex-vuejs`, base técnica del microfrontend de PeopleFirst
- **Reemplaza a:** —
- **Relacionadas:** [ADR 0002 — Turborepo](0002-turborepo.md), [ADR 0003 — pnpm](0003-pnpm.md),
  [Monorepo vs multi-repo](../monorepo-vs-multirepo.md),
  [Registro de riesgos](../riesgos.md)

---

## Contexto

PeopleFirst necesita desacoplar el frontend del monolito `monolith-do-core` sin una
reescritura Big Bang. La referencia interna existente es **`frontend-host` (Talana)**, que
usa Module Federation en **multi-repo**: un repositorio por host y por remote.

Ese modelo resuelve un problema real —fronteras duras entre muchos equipos que avanzan en
paralelo— pero cobra un peaje que el equipo ya está sintiendo:

| Síntoma en `frontend-host`     | Causa raíz                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| Código compartido duplicado    | La lógica común vive copiada, o como paquete npm publicado aparte                       |
| Refactor = publicar versión    | Cambiar algo compartido obliga a subir versión y actualizarla en cada remote consumidor |
| Desincronización entre remotes | Cada repo puede quedar en una versión distinta del paquete compartido                   |

PeopleFirst **no tiene el mismo problema organizacional**:

|                   | `frontend-host` (Talana)           | PeopleFirst (nuevo MF)              |
| ----------------- | ---------------------------------- | ----------------------------------- |
| Equipos           | Muchos equipos en paralelo         | 2 desarrolladores, un solo equipo   |
| Repositorios      | Multi-repo (1 por remote/host)     | Monorepo (host + remotes + shared)  |
| Código compartido | Paquete npm publicado y versionado | Workspace local, mismo PR           |
| Build y deploy    | Independiente por repo             | Independiente por app (se mantiene) |

Multi-repo resuelve **fronteras entre equipos**. Monorepo resuelve **mantenibilidad para un
equipo chico**. Ninguno es mejor en abstracto: depende de cuántas manos tocan el código.

## Decisión

**Module Federation en un monorepo de un solo repositorio**, con esta estructura:

```
pokedex-vuejs/
├── package.json               ← workspaces + orquestación (NO es un proyecto)
├── turbo.json                 ← grafo de tareas y cache (ADR 0002)
├── docs/adr/                  ← decisiones de arquitectura
├── packages/
│   └── mf-shared/             ← contrato `shared` de MF (SOLO build-time)
└── apps/
    ├── host/                  ← shell: layout, router, plugins   → :5173
    ├── remote-pokemon/        ← hexágono pokemon (PokeAPI)       → :5174
    └── remote-dragonball/     ← hexágono character (DB API)      → :5175
```

Y con estas cinco reglas, que son lo que hace que el monorepo **no** degenere en monolito:

### 1. Cada app es su propio hexágono. El expose es su API pública.

Cada remote expone **una sola cosa**: un `RouteRecordRaw[]`.

```ts
// apps/remote-pokemon/module-federation.config.ts
exposes: { './routes': './src/modules/pokemon/presentation/routes/pokemon.routes.ts' }
```

No cruzan la frontera: entidades (`Pokemon`, `Character`), casos de uso, ports, adapters
HTTP, contenedores de Awilix, mappers ni presentation models. **El expose es a un
microfrontend lo que una API REST es a un microservicio.**

La consecuencia práctica: el interior de un remote se puede reescribir completo sin tocar
el host, mientras el `RouteRecordRaw[]` siga cumpliendo.

### 2. `packages/` solo contiene metadata de build-time. Nunca código de runtime.

`@pokedex/mf-shared` existe porque el bloque `shared` de MF es lo único que hace que las
tres apps se pongan de acuerdo sobre qué librerías deben resolver a **una** instancia.
Declararlo tres veces a mano significaba que nada fallaba cuando las copias divergían — y
divergir acá no rompe el build, rompe **producción** (dos copias de Vue → `inject()` no
encuentra nada; dos routers → las pantallas del remote nunca ven la navegación del host).

Es seguro compartirlo porque `vite.config.ts` lo consume en Node, en build-time, y nunca
llega al navegador.

**Un paquete de workspace que embarque código de runtime es otra historia:** se bundlearía
en cada remote (N copias, N copias de cualquier estado a nivel de módulo) salvo que él
mismo esté declarado en `shared` — y una dependencia de workspace resuelve a un symlink en
versión `0.0.0`, lo que vuelve sin sentido la negociación de `requiredVersion`.

Por eso la duplicación de `src/base/` entre las tres apps es **deliberada**, no descuido.

### 3. La duplicación tiene un criterio, no una intuición

Antes de mover algo a `packages/`:

| Pregunta                                                     | Si la respuesta es… | Entonces                                     |
| ------------------------------------------------------------ | ------------------- | -------------------------------------------- |
| ¿Se ejecuta en el navegador?                                 | Sí                  | **No** va a `packages/` (ver regla 2)        |
| ¿Tiene estado a nivel de módulo (store, singleton, cliente)? | Sí                  | **No** va a `packages/`                      |
| ¿Cambiarlo obliga a redeployar más de una app a la vez?      | Sí                  | **No** va a `packages/` — acopla despliegues |
| ¿Es metadata leída por el build (config, tipos, constantes)? | Sí                  | Candidato válido                             |
| ¿La copia divergiendo en silencio rompe producción?          | Sí                  | Candidato válido y probablemente necesario   |

Sin este criterio, `shared/` se convierte en un mini-monolito interno: es el riesgo
**R5** del [registro de riesgos](../riesgos.md).

### 4. Un remote caído no tumba el shell

Los contratos se cargan con `import()` dinámico y `Promise.allSettled` en
`registerRemoteRoutes()`. Un remote que no responde degrada **solo su sección**; el resto
de la aplicación funciona normal. Está cubierto en `e2e/remote-outage.spec.ts`, que aborta
el tráfico al origen de un remote.

Con los imports estáticos anteriores, un remote caído dejaba el `#app` en 0 bytes: sin
navbar, y el otro remote inaccesible aunque estuviera sano.

### 5. La verificación real corre contra builds, no contra dev servers

Este es el punto no obvio y el que más veces se olvida:

> Un dev server sirve módulos sin minificar y sin chunkear, así que el contrato `shared`
> nunca se negocia de verdad y el minificador nunca entra. Peor: el **grafo de chunks
> federados depende del gestor de paquetes** — un install hoisted y uno estricto producen
> artefactos con estructura distinta (medido en el [ADR 0003](0003-pnpm.md)).

Es decir: **el entorno de desarrollo esconde exactamente los fallos que la federación
introduce**, y el artefacto que se verifica tiene que salir del mismo install que el que se
despliega.
Por eso `pnpm test:e2e:preview` (builds servidos desde tres orígenes) es lo que corre CI,
y no `test:e2e` (dev servers).

No es teórico: el primer `test:e2e:preview` tumbó 5 de 7 tests que pasaban en dev, por un
`InjectionMode.CLASSIC` de Awilix que resuelve por nombre de parámetro del constructor —
nombre que el minificador renombra a `e`. Llevaba ahí desde el primer commit.

## Consecuencias

### A favor

- **Refactor atómico.** Un PR cambia `packages/mf-shared` y sus tres consumidores a la vez,
  sin publicar ni versionar nada.
- **Visibilidad de impacto.** `turbo run lint type-check test` corre sobre todo el
  workspace: se ve de inmediato si algo se rompió.
- **Menos overhead de configuración.** Un Prettier, un husky, un CI para 2 personas — no N
  configuraciones que mantener sincronizadas.
- **Sigue siendo MF real.** Cada app conserva su propio `dist/` y su propio deploy
  independiente. El monorepo es conveniencia de desarrollo, no de despliegue.
- **Onboarding simple.** Un clone, un install, todo el sistema corriendo en local.

### En contra (deuda aceptada y consciente)

1. **La URL de cada remote está horneada en el build del host.**
   `VITE_REMOTE_POKEMON_ENTRY` y `VITE_REMOTE_DRAGONBALL_ENTRY` se resuelven en build-time,
   así que mover un remote de origen implica **rebuild del host**. Es el acoplamiento de
   despliegue que MF debería eliminar, y hoy no lo hace.
   → Riesgo **R6**. El paso siguiente es resolver esas URLs en runtime
   (`window.__MF_REMOTES__` inyectado por el servidor, o el runtime API de MF).

2. **Lockfile único.** Un bump de dependencia toca a las tres apps a la vez, y el pipeline
   de cualquier app necesita el lockfile de la raíz. Con pnpm al menos el install se limita
   al subgrafo real de cada app (`pnpm install --filter host...`), lo que bajo npm workspaces
   no era expresable. → Riesgo **R7**, [ADR 0003](0003-pnpm.md).

3. **El preflight de Tailwind se inyecta una vez por app**: 3.616 B (~1.306 B gzip) ×3 en la
   misma página. Hoy las tres capas `base` son byte a byte idénticas, así que es desperdicio,
   no un bug visual. → Riesgo **R9**.

4. **`dts: false`.** La generación automática de `.d.ts` de MF invoca `tsc` pelado y no sabe
   compilar `.vue` ni `.css`. El contrato de tipos está declarado a mano en
   `apps/host/src/types/remotes.d.ts`. Cuesta un archivo mantenido a mano; a cambio el
   contrato se revisa en un PR. → Riesgo **R10**.

5. **Acoplamiento de versiones.** Host y remotes tienden a compartir versión de Vue/TS;
   aislar un remote en otra versión es más incómodo que en multi-repo. → Riesgo **R1**.

## Condiciones bajo las que hay que revisar esta decisión

Un ADR sin criterio de salida es una opinión. Esta decisión se revisa —posiblemente hacia
multi-repo— si se cumple **cualquiera** de estas:

| Señal                                                                 | Umbral                           |
| --------------------------------------------------------------------- | -------------------------------- |
| El equipo se parte en sub-equipos con ritmos de release distintos     | ≥ 3 equipos independientes       |
| Un remote necesita una versión mayor de Vue/TS distinta al resto      | 1 caso real, no hipotético       |
| El tiempo de CI en frío pasa a ser el cuello de botella de la entrega | > 15 min con Remote Cache activo |
| Aparece la necesidad de permisos de repositorio distintos por dominio | 1 caso de compliance real        |
| El número de apps hace impracticable el `npm install` único           | > 12 apps                        |

Migrar después cuesta (reordenar historia de git, permisos y CI): es el riesgo **R4**, y la
mitigación es justamente vigilar estas señales en vez de descubrirlas tarde.

## Alternativas consideradas

| Alternativa                              | Por qué no                                                                                                                                   |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Multi-repo MF** (como `frontend-host`) | Resuelve fronteras entre equipos que PeopleFirst no tiene. Con 2 devs, el costo de publicar/versionar el paquete compartido no compra nada.  |
| **Monolito frontend único (SPA grande)** | No permite migración incremental del monolito PHP vista por vista, ni despliegue independiente por dominio.                                  |
| **iframes**                              | Aísla de verdad, pero rompe navegación, foco, accesibilidad y compartir sesión/estado; el shell no puede derivar la navegación de las rutas. |
| **Web Components sin MF**                | Sirve como puente táctico dentro del monolito (y así se usará para KPI mientras JWT no esté), pero no da router compartido ni singletons.    |
| **Nx en vez de Turborepo**               | Ver [ADR 0002](0002-turborepo.md).                                                                                                           |

## Referencias

- [Module Federation — Vite](https://module-federation.io/integrations/build-tool/vite.html)
- [Module Federation — Monorepos](https://module-federation.io/integrations/framework/monorepos.html)
- [Benefits of Module Federation in a Monorepo](https://module-federation.io/practice/monorepos/)
- `packages/mf-shared/src/index.ts` — el contrato, con su razonamiento inline
- `packages/mf-shared/tests/shared-contract.spec.ts` — el guard que impide que el contrato mienta
