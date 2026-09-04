# Registro de riesgos — Microfrontend PeopleFirst (monorepo + Module Federation)

**Última revisión:** 2026-09-04 · **Alcance:** POC `pokedex-vuejs` + implementación en PeopleFirst

Cada riesgo tiene **señal de alerta** (cómo se detecta antes de que duela), **mitigación**
(qué se hace, concreto) y **dueño**. Un riesgo sin señal de alerta es una sorpresa
programada.

## Cómo leer la clasificación

| Nivel        | Criterio                                                                |
| ------------ | ----------------------------------------------------------------------- |
| 🔴 **Alto**  | Impacto en producción o bloqueo de entrega, y probabilidad media o alta |
| 🟠 **Medio** | Fricción sostenida de desarrollo, o impacto alto con probabilidad baja  |
| 🟡 **Bajo**  | Deuda aceptada, contenida y documentada                                 |

Estado: **Mitigado** (la mitigación ya está en el repo) · **Vigilado** (hay señal de alerta,
no hay acción pendiente) · **Abierto** (requiere trabajo)

---

## Resumen

| ID  | Riesgo                                                    | Nivel | Estado                     |
| --- | --------------------------------------------------------- | ----- | -------------------------- |
| R1  | Acoplamiento de versiones entre host y remotes            | 🟠    | Mitigado                   |
| R2  | CI lento: cada push rebuildea todo                        | 🟠    | Mitigado                   |
| R3  | El monorepo no escala igual al crecer el equipo           | 🟠    | Vigilado                   |
| R4  | Migrar a multi-repo después cuesta                        | 🟡    | Vigilado                   |
| R5  | `shared/` degenera en mini-monolito interno               | 🔴    | Mitigado                   |
| R6  | URL de los remotes horneada en el build del host          | 🔴    | **Abierto**                |
| R7  | Lockfile único acopla los pipelines                       | 🟠    | Mitigado                   |
| R8  | El dev server no ejercita el contrato `shared`            | 🔴    | Mitigado                   |
| R9  | Preflight de Tailwind duplicado ×N en la misma página     | 🟡    | Vigilado                   |
| R10 | Contrato de tipos a mano (`dts: false`) se desincroniza   | 🟠    | Mitigado                   |
| R11 | Dos lockfiles en el repo                                  | 🟠    | Resuelto                   |
| R12 | Cache de turbo envenenado por env vars no declaradas      | 🔴    | Mitigado                   |
| R13 | Remote Cache compartido sin firma de artefactos           | 🔴    | **Abierto** (al activarlo) |
| R14 | Puertos fijos: colisión rompe el arranque                 | 🟡    | Mitigado                   |
| R15 | **JWT es bloqueante** de todo el roadmap                  | 🔴    | **Abierto**                |
| R16 | Dependencia de SRE en el camino crítico                   | 🔴    | **Abierto**                |
| R17 | CORS y cache headers mal configurados en el bucket        | 🔴    | **Abierto**                |
| R18 | Doble manejador de rutas: monolito PHP vs router del host | 🟠    | **Abierto**                |
| R19 | Colisión de estilos entre remotes y con el legacy         | 🟠    | **Abierto**                |
| R20 | Pantalla en blanco en el _first hit_ del HOST             | 🟠    | **Abierto**                |
| R21 | Un remote caído degrada mal y arrastra al shell           | 🟠    | Mitigado                   |
| R22 | Deriva entre la POC y la planificación (stack, tooling)   | 🟠    | **Abierto**                |

---

## Riesgos del modelo monorepo

Los cinco que ya se presentaron al equipo, ahora con mitigación.

### R1 · Acoplamiento de versiones entre host y remotes 🟠 Mitigado

Host y remotes tienden a compartir versión de Vue/TS porque conviven en un lockfile. Aislar un
remote en otra versión mayor es más incómodo que en multi-repo.

Y había un agujero peor, que el guard original no cubría. `shared-contract.spec.ts` verifica
que el rango de cada app esté **dentro** del `requiredVersion` federado, pero no que las apps
declaren lo **mismo** entre sí:

| app                 | declara       | ⊆ `^3.5.0`? |
| ------------------- | ------------- | ----------- |
| `host`              | `vue ^3.5.32` | ✓           |
| `remote-pokemon`    | `vue ^3.6.0`  | ✓           |
| `remote-dragonball` | `vue ^3.5.32` | ✓           |

Los tres pasan el guard, el type-check, el lint y los tests. Y `remote-pokemon` puede resolver
una versión de Vue que las otras dos no van a resolver nunca: dos copias en la misma página,
`inject()` que no encuentra nada, y nada en el pipeline lo dijo.

- **Señal de alerta:** un PR que necesita subir una librería en una app y no en las otras. O
  `pnpm deps:check` fallando.
- **Mitigación (hecha), en tres capas:**
  1. `requiredVersion` es un **rango**, no una versión exacta, así que el shell y un remote
     construidos con semanas de diferencia siguen negociando. Ensanchar un rango es una
     decisión deliberada, se hace **una vez y para todos** en `packages/mf-shared/src/index.ts`.
  2. `shared-contract.spec.ts` impide que el rango declarado se salga del `requiredVersion`.
  3. **`pnpm deps:check` (Syncpack) impide que las apps declaren rangos distintos entre sí** —
     el agujero de la tabla de arriba. Corre en CI antes de lint/tipos/tests. Ver
     [ADR 0004](adr/0004-syncpack-renovate.md).

  Y Renovate agrupa los cuatro singletons en un solo PR con etiqueta `mf-contract`, para que
  no exista un bump que suba Vue en el host y se olvide de un remote.

- **Si se materializa:** ese remote sale a su propio repo. Es el caso de salida #2 del
  [ADR 0001](adr/0001-module-federation-en-monorepo.md#condiciones-bajo-las-que-hay-que-revisar-esta-decisión).
- **Dueño:** Frontend

### R2 · CI lento: cada push rebuildea todo 🟠 Mitigado

Sin cache ni filtrado, un cambio de una línea en un remote recomputa lint, tipos, tests y
build de las tres apps. Con un remote por dominio migrado, esto se vuelve el cuello de
botella de la entrega.

- **Señal de alerta:** duración del job `checks` creciendo linealmente con el número de apps.
  Umbral de acción: > 10 min en frío.
- **Mitigación (hecha):** Turborepo con grafo de tareas y cache por hash de inputs, más
  `actions/cache` sobre `.turbo` en CI, por rama y con fallback a `main`. Medido: 8 de 11
  tareas desde cache; el build baja de ~30 s a ~2,6 s. Ver
  [ADR 0002](adr/0002-turborepo.md).
- **Pendiente:** Remote Cache compartido y `--affected` cuando el CI en frío pase de ~10 min.
- **Dueño:** Frontend

### R3 · El monorepo no escala igual al crecer el equipo 🟠 Vigilado

Si el equipo se divide en sub-equipos con ritmos distintos, reaparece la fricción que hoy
tiene `frontend-host`: PRs que se pisan, revisiones cruzadas, un CI compartido como recurso
en disputa.

- **Señal de alerta:** ≥ 3 equipos con calendarios de release independientes, o PRs bloqueados
  esperando review de otro dominio.
- **Mitigación:** los umbrales de revisión están **escritos** en el
  [ADR 0001](adr/0001-module-federation-en-monorepo.md#condiciones-bajo-las-que-hay-que-revisar-esta-decisión)
  y se revisan cada trimestre. La decisión no es permanente, es la correcta **para 2 devs**.
- **Dueño:** Frontend + liderazgo técnico

### R4 · Migrar a multi-repo después cuesta 🟡 Vigilado

Pasar de monorepo a multi-repo implica reordenar historia de git, permisos y CI.

- **Señal de alerta:** ver R3.
- **Mitigación:** la estructura ya está lista para el corte. Cada app tiene su propio
  `package.json`, `vite.config.ts`, `module-federation.config.ts`, tests, `.env.example` y
  `dist/`; no hay imports cruzados entre apps (verificado por `eslint-plugin-boundaries`).
  Extraer `apps/remote-x/` a su repo con `git subtree split` conserva la historia. Lo único
  que hay que resolver en ese momento es publicar `@pokedex/mf-shared` como paquete npm.
- **Nota:** este riesgo **se abarata** manteniendo las reglas del ADR 0001. Cada import
  cruzado que se cuele lo encarece.
- **Dueño:** Frontend

### R5 · `shared/` degenera en mini-monolito interno 🔴 Mitigado

"Shared" es una decisión de diseño, no algo que el tooling resuelva. Sin criterio, todo lo
que se parece a común termina ahí, y `packages/` se convierte en el monolito del que se
estaba huyendo — con la agravante de que un paquete de **runtime** compartido se bundlea en
cada remote (N copias, N copias de cualquier estado a nivel de módulo).

- **Señal de alerta:** un PR que agrega a `packages/` un `.vue`, un store, un cliente HTTP o
  cualquier cosa que se ejecute en el navegador. O un cambio en `packages/` que obliga a
  redeployar más de una app a la vez.
- **Mitigación (hecha):** `packages/mf-shared` contiene **solo metadata de build-time**, con
  la regla escrita en el propio archivo. La tabla de cinco preguntas del
  [ADR 0001](adr/0001-module-federation-en-monorepo.md#3-la-duplicación-tiene-un-criterio-no-una-intuición)
  se aplica en review antes de mover algo. La duplicación de `src/base/` entre apps es
  deliberada: es el precio de que cada una sea autónoma.
- **Ojo con el detalle técnico:** una dependencia de workspace resuelve a un symlink en
  versión `0.0.0`, lo que vuelve **sin sentido** la negociación de `requiredVersion` de MF.
  Un paquete de runtime compartido no es solo desprolijo: es incorrecto.
- **Dueño:** Frontend (en review de PR)

---

## Riesgos técnicos detectados en la POC

Estos no estaban en la presentación. Salieron de leer el código.

### R6 · URL de los remotes horneada en el build del host 🔴 Abierto

`VITE_REMOTE_POKEMON_ENTRY` y `VITE_REMOTE_DRAGONBALL_ENTRY` se resuelven en el build del
host. Mover un remote de origen, o apuntar el host a otro ambiente, **obliga a rebuildear y
redeployar el host**. Es exactamente el acoplamiento de despliegue que Module Federation
existe para eliminar.

En PeopleFirst esto pega más fuerte que en la POC: si cada dominio migrado es un remote en
`gs://<bucket>/<env>/<app>/`, cualquier reorganización de rutas del bucket es un release del
host.

- **Señal de alerta:** el primer ticket que diga "hay que redeployar el host para mover un
  remote".
- **Mitigación propuesta:** resolver las URLs en **runtime**, no en build-time. Dos caminos:
  1. `window.__MF_REMOTES__` inyectado por el servidor/Nginx que sirve el host (o un
     `remotes.json` fetcheado antes de crear el router). Simple, y encaja con el playbook de
     Nginx que ya hay que definir con SRE.
  2. El [runtime API de Module Federation](https://module-federation.io/guide/basic/runtime.html)
     (`registerRemotes`) — más flexible, permite registrar remotes descubiertos.
     Con cualquiera de las dos, la tabla de remotes pasa a ser **configuración de ambiente** y
     no un artefacto compilado.
- **Cuándo:** antes de tener el segundo remote real en producción. Después es una migración
  con coordinación.
- **Dueño:** Frontend + SRE (inyección de config)

### R7 · Lockfile único acopla los pipelines 🟠 Mitigado

El monorepo tiene un lockfile en la raíz. Un bump de dependencia toca a las tres apps a la
vez, y el pipeline de cualquier app necesita el lockfile de la raíz como contexto de build.

Bajo npm workspaces esto era peor de lo necesario: no había forma de instalar solo el
subgrafo de una app — `npm ci --workspace host --include-workspace-root` instalaba el árbol
completo. Con pnpm el subgrafo **sí** es expresable:

```dockerfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/host/package.json apps/host/
COPY packages/mf-shared/package.json packages/mf-shared/
RUN corepack enable && pnpm install --frozen-lockfile --filter host...
```

`--filter host...` (con los tres puntos) instala el host **y sus dependencias de workspace**,
nada más.

- **Señal de alerta:** un CVE que hay que parchear en una app y no en las otras, o un bump que
  rompe una app y bloquea el release de las demás.
- **Mitigación (hecha):** el `dist/` de cada app **sí** es independiente; el acoplamiento es
  solo de instalación, no de artefacto. Los builds por app usan `--filter` de turbo, así que
  un bump que no afecta a una app no la reconstruye. Y con pnpm el install baja de "todo el
  árbol" al subgrafo real. Ver [ADR 0003](adr/0003-pnpm.md).
- **Queda:** un bump que rompe una app sigue bloqueando el release de las demás. Deuda
  aceptada mientras el equipo sean 2 personas.
- **Dueño:** Frontend

### R8 · El dev server no ejercita el contrato `shared` 🔴 Mitigado

**El riesgo más traicionero de todo el documento.** Un dev server sirve módulos sin minificar
y sin chunkear, así que el contrato `shared` de MF nunca se negocia de verdad y el
minificador nunca entra. Un `requiredVersion` roto puede pasar dev y fallar en producción.

Y hay una segunda capa, medida durante la migración a pnpm: **el grafo de chunks federados
cambia según el gestor de paquetes.** Mismo código, misma versión del plugin de MF, mismo
`sharedSingletons` — solo cambia el install:

|                                        | npm (hoisted)                                                        | pnpm (estricto)                                                               |
| -------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Chunks de fallback en `remote-pokemon` | 2, fundidos — vue sin chunk propio, 151 kB de vue+pinia+colada junto | 4, uno por dependencia — vue 117,9 kB · router 26,2 · colada 15,2 · pinia 8,2 |
| `dist/` total por remote               | 508 kB                                                               | 532 kB                                                                        |

O sea: **el artefacto que verificás depende también de cómo instalaste.** Medición completa y
su lectura en el [ADR 0003](adr/0003-pnpm.md).

- **Señal de alerta:** un test que pasa en `test:e2e` y falla en `test:e2e:preview`. Eso no es
  flakiness, es este riesgo materializándose. Y ahora también: cambiar de gestor de paquetes o
  de lockfile sin volver a correr el E2E contra builds.
- **Mitigación (hecha):** CI corre `test:e2e:preview` —los tres `dist/` servidos desde tres
  orígenes— y **ese** es el job que bloquea el merge. `reuseExistingServer` está apagado en
  modo preview a propósito: reusar un dev server ahí testearía justo lo que este modo existe
  para evitar. Se agregó además `scripts/smoke-federation.mjs`, que verifica sin navegador que
  cada manifest declare los cuatro singletons con `singleton: true` y el `requiredVersion` del
  contrato.
- **Evidencia de que es real:** la primera corrida de `test:e2e:preview` tumbó 5 de 7 tests que
  pasaban en dev, por un `InjectionMode.CLASSIC` de Awilix que resuelve por nombre de parámetro
  del constructor — nombre que el minificador renombra a `e`. Llevaba ahí desde el primer commit.
- **Corrección de una afirmación previa:** se dijo que migrar a pnpm "mataba" este riesgo,
  porque su `node_modules` no es plano. **Es falso.** La ilusión no viene del hoisting sino de
  que un dev server no minifica ni chunkea; cada app corre su propio Vite en su propio origen
  con cualquier gestor de paquetes. pnpm no ejercita el contrato `shared` en dev. Lo que sí hizo
  fue destapar la diferencia de grafo de chunks de la tabla de arriba — un problema distinto,
  que hace este job **más** importante, no menos.
- **Para PeopleFirst:** este job es **no negociable** en el pipeline. Es lo único que prueba que
  la composición funciona de verdad.
- **Dueño:** Frontend

### R9 · Preflight de Tailwind duplicado ×N en la misma página 🟡 Vigilado

Tailwind genera CSS escaneando las fuentes de **cada** app, así que el módulo expuesto
importa su propio stylesheet para que los estilos viajen con el contrato. El costo: el
preflight se inyecta una vez por app — 3.616 B (~1.306 B gzip) ×3 hoy.

- **Señal de alerta:** una capa `base` que deje de ser byte a byte idéntica entre apps. Ahí
  pasa de desperdicio a **bug visual**, y el orden de carga (no determinista) decide quién
  gana.
- **Mitigación:** hoy las tres son idénticas. Con más de ~5 remotes, o si alguien
  personaliza el preflight de una app, mover el preflight a una hoja única servida por el
  host y desactivarlo en los remotes.
- **Deuda aceptada y documentada.**
- **Dueño:** Frontend

### R10 · Contrato de tipos a mano se desincroniza del expose real 🟠 Mitigado

`dts: false` porque la generación automática de MF invoca `tsc` pelado y no sabe compilar
`.vue` ni `.css`. El contrato vive escrito a mano en `apps/host/src/types/remotes.d.ts`.
Nada impide que el remote cambie su expose y el `.d.ts` del host siga afirmando lo viejo:
compila, y falla en runtime.

- **Señal de alerta:** un cambio en `module-federation.config.ts` de un remote sin cambio
  correspondiente en `remotes.d.ts` en el mismo PR.
- **Mitigación (hecha):** el E2E contra builds carga los contratos reales, así que un
  desalineamiento rompe el pipeline. Y declararlo a mano **obliga** a que el contrato se
  revise en un PR, que es la mitad del valor.
- **Mejora posible:** un test que compare las claves de `exposes` de cada
  `module-federation.config.ts` contra los `declare module` del host — el mismo patrón que
  el guard de `mf-shared`.
- **Dueño:** Frontend

### R11 · Dos lockfiles en el repo 🟠 Resuelto

Convivían `package-lock.json` (288 kB, el que se usaba) y `pnpm-lock.yaml` (5,8 kB, residual).
Un repo con dos lockfiles tiene detección ambigua de gestor de paquetes: turbo, Renovate,
Docker y el CI pueden elegir distinto, y "funciona en mi máquina" pasa a ser literal.

- **Resolución (hecha):** se migró a **pnpm 10** y se eliminó `package-lock.json`.
  `pnpm-lock.yaml` es el único lockfile, y `"packageManager": "pnpm@10.34.5"` en el
  `package.json` raíz vuelve determinista la detección para todas las herramientas. Alinea
  además la POC con lo que pide la planificación de PeopleFirst.
- **Detalle honesto:** la razón que más se invoca para migrar a pnpm —detectar dependencias
  fantasma— **no aplicó acá**: el install estricto encontró cero. Las tres apps declaran bien
  lo que importan. Lo que sí encontró está en el [ADR 0003](adr/0003-pnpm.md).
- **Dueño:** Frontend

### R12 · Cache de turbo envenenado por env vars no declaradas 🔴 Mitigado

Turbo hashea inputs para decidir cache hits. Si una variable que entra al bundle no está
declarada, dos builds con URLs de CDN distintas se ven idénticos y devuelve el cacheado. El
síntoma: un remote en producción pidiendo sus chunks al bucket de staging. 404 en runtime,
CI en verde.

Es el modo de fallo más peligroso que introduce el cache.

- **Señal de alerta:** un `dist/` cuyo contenido no corresponde al ambiente al que se
  desplegó. Verificable en el pipeline con un `grep` de la URL esperada en el bundle antes de
  publicar.
- **Mitigación (hecha):** las cuatro variables `VITE_*` que entran al bundle están declaradas
  en `turbo.json → tasks.build.env`. Los `.env` están en `inputs`.
- **Regla operativa:** **cada variable nueva que llegue a un bundle se agrega a esa lista.**
  Va en la checklist de review de PR.
- **Escotilla de emergencia:** `turbo run build --force`.
- **Dueño:** Frontend (en review de PR)

### R13 · Remote Cache compartido sin firma de artefactos 🔴 Abierto (al activarlo)

Hoy el cache es local y por runner: sin superficie de ataque. Al activar Remote Cache
compartido entre CI y las máquinas del equipo, **quien pueda escribir en el cache puede
entregar artefactos arbitrarios al pipeline**, y esos artefactos se despliegan.

- **Mitigación obligatoria al activarlo:** `remoteCache.signature: true` +
  `TURBO_REMOTE_CACHE_SIGNATURE_KEY` como secret. Sin eso, no se activa.
- **Alcance:** solo aplica cuando se dé el paso pendiente del
  [ADR 0002](adr/0002-turborepo.md#estado-y-pasos-siguientes).
- **Dueño:** Frontend + SRE

### R14 · Puertos fijos: colisión rompe el arranque 🟡 Mitigado

5173/5174/5175 con `strictPort`. Si algo más ocupa un puerto, el arranque falla.

- **Mitigación (hecha):** falla **a propósito**. El host tiene horneada la URL de cada
  `remoteEntry.js`; un remote que se mueve de puerto en silencio haría fallar la federación
  de forma mucho más confusa que un "puerto ocupado".
- **Nota:** desaparece cuando se resuelva R6 (URLs en runtime).
- **Dueño:** Frontend

---

## Riesgos de la implementación en PeopleFirst

Del roadmap de la planificación. Estos son de ejecución, no de arquitectura.

### R15 · JWT es bloqueante de todo el roadmap 🔴 Abierto

La autenticación JWT es prerrequisito para que el HOST y los remotes gestionen la sesión.
Toda la Fase 2 en adelante depende de ella. Si se atrasa, se atrasa el proyecto completo.

- **Señal de alerta:** semana 2 sin JWT validado en un ambiente de desarrollo.
- **Mitigación (ya prevista en el plan):** la vía de **Web Components** para KPI. Exportar la
  vista de Vue 3 como Web Component agnóstico y embeberla en el monolito con una etiqueta
  HTML estándar, sin depender del nuevo HOST. Desacopla el avance de producto del bloqueante
  de infraestructura.
- **Mitigación adicional:** el trabajo de Fase 2 que **no** depende de JWT (shell, router con
  Web History, `sharedSingletons`, `offlineHandlingPlugin`, `ErrorMfeTemplate`) se puede
  hacer en paralelo contra un stub de sesión. Definir ese stub en la semana 1.
- **Dueño:** Backend (JWT) · Frontend (stub y vía Web Component)

### R16 · Dependencia de SRE en el camino crítico 🔴 Abierto

Se estima 1 semana de margen para coordinar el playbook de despliegue, Terraform, Nginx,
pipelines de GitHub Actions y URLs de prueba en DEP. SRE participa "solo en la creación
inicial del HOST", lo que concentra todo el riesgo en un único hito temprano.

- **Señal de alerta:** fin de la semana 1 sin playbook escrito ni bucket creado.
- **Mitigación:** llevar a la reunión con SRE una lista **cerrada** de requerimientos, para
  que sea una sola conversación y no cinco idas y vueltas:
  1. Dominio propio en el proyecto de GCP del clúster, **aislado del Load Balancer web
     tradicional** (ver R20).
  2. Bucket centralizado con estructura `gs://<bucket>/<env>/<app>/`.
  3. **CORS** del bucket con `Access-Control-Allow-Origin` para el dominio del host (R17).
  4. **Cache headers**: `remoteEntry.js` y `mf-manifest.json` con TTL corto o `no-cache`;
     chunks con hash `immutable, max-age=31536000` (R17).
  5. Mecanismo de **inyección de configuración en runtime** para la tabla de remotes (R6).
  6. Certificados y URLs de prueba en DEP.
  7. Quién puede escribir en el bucket y desde qué pipeline.
- **Mitigación estructural:** mientras el HOST no exista, la vía Web Component (R15) mantiene
  al equipo produciendo.
- **Dueño:** Tamy (coordinación) · SRE (ejecución)

### R17 · CORS y cache headers mal configurados en el bucket 🔴 Abierto

Dos fallos distintos, ambos silenciosos en staging y ruidosos en producción:

- **Sin CORS:** el host hace `import()` de `remoteEntry.js` cross-origin. Sin
  `Access-Control-Allow-Origin` para el dominio del host, el remote no carga. Nunca.
- **Cache agresivo del entry:** si `remoteEntry.js` se cachea con TTL largo, se despliega una
  versión nueva del remote y **el host sigue viendo la vieja**, indefinidamente. Peor: puede
  quedar un entry viejo apuntando a chunks con hash que ya no existen → 404 parciales y
  pantallas a medias.
- **Señal de alerta:** un deploy de remote que "no se ve" en producción; errores de CORS en
  consola; 404 de chunks con hash.
- **Mitigación:** los headers correctos van al playbook de SRE **antes** del primer deploy
  (lista de R16, puntos 3 y 4). Y un smoke test post-deploy que verifique
  `Access-Control-Allow-Origin` y `Cache-Control` del entry — un `curl -I` en el pipeline
  alcanza.
- **Dueño:** SRE (configuración) · Frontend (smoke test)

### R18 · Doble manejador de rutas: monolito PHP vs router del host 🟠 Abierto

Durante la coexistencia del patrón estrangulador, dos routers reciben URLs. Si los esquemas
se solapan, el resultado depende del orden de los handlers: navegación que a veces recarga
la página entera, a veces no.

- **Señal de alerta:** una URL que se comporta distinto según si se llega por link interno o
  por refresh del navegador.
- **Mitigación (ya prevista en el plan):** **rutas disjuntas** — esquemas de URL únicos y sin
  solape para las subaplicaciones del HOST. Vale la pena hacerlo explícito y verificable: un
  test que compare la tabla de rutas del host contra la lista de rutas que sigue sirviendo el
  monolito, y falle si hay intersección.
- **Mitigación de reversa:** el **feature flag** por ruta permite devolverle el tráfico al
  monolito sin un deploy. Requisito: que el flag se evalúe en runtime, no en build-time.
- **Nota:** Web History (sin `#`) es lo correcto para URLs limpias, pero exige que Nginx
  haga fallback a `index.html` en las rutas del host. Va en el playbook de SRE.
- **Dueño:** Frontend + Backend

### R19 · Colisión de estilos entre remotes y con el legacy 🟠 Abierto

Varios remotes inyectando su CSS en la misma página, más el CSS del monolito cuando conviven.
Sin encapsulación, el orden de carga —no determinista— decide quién gana.

- **Señal de alerta:** un estilo que cambia según qué sección se visitó primero.
- **Mitigación (ya prevista en el plan):** `postcss-prefix-selector` para encapsular el CSS de
  cada remote bajo un ID único (`#remote-app-kpi`), y prefijos de Tailwind por app (`kpi:`,
  `host:`).
- **Mitigación adicional:** un test visual o un E2E que cargue dos remotes en la misma página
  y verifique una propiedad computada clave de cada uno. Sin eso, la colisión se descubre en
  producción.
- **Cruce con R9:** el preflight de Tailwind es el caso especial, porque no lleva prefijo.
- **Dueño:** Frontend

### R20 · Pantalla en blanco en el first hit del HOST 🟠 Abierto

Colgar el HOST del Load Balancer web tradicional y leer directo del bucket introduce latencia
en el primer hit: pantalla en blanco mientras se resuelve el shell.

- **Señal de alerta:** TTFB del `index.html` del host, y tiempo hasta el primer render, medidos
  en DEP antes de producción.
- **Mitigación (ya prevista en el plan):** aislar el HOST en un recurso propio de GCP, no
  colgarlo del LB web tradicional.
- **Mitigación de frontend:** el `index.html` del host debe traer un skeleton o loader
  inline —no un `<div id="app">` vacío— para que el primer paint no sea blanco aunque la
  red tarde.
- **Dueño:** SRE (infraestructura) · Frontend (skeleton)

### R21 · Un remote caído degrada mal y arrastra al shell 🟠 Mitigado

Con imports estáticos, un remote caído dejaba el `#app` en 0 bytes: sin navbar, y el otro
remote inaccesible aunque estuviera sano.

- **Mitigación (hecha en la POC):** `import()` dinámico + `Promise.allSettled` en
  `registerRemoteRoutes()`, con un fallback por remote. Un remote que no responde degrada
  **solo su sección**: queda en la barra y su ruta base explica qué pasó. Cubierto por
  `e2e/remote-outage.spec.ts`, que aborta el tráfico al origen de un remote.
- **Para PeopleFirst:** equivale al `offlineHandlingPlugin` + `ErrorMfeTemplate` del plan. La
  POC ya tiene el patrón funcionando y con test — se porta, no se reinventa.
- **Dueño:** Frontend

### R22 · Deriva entre la POC y la planificación 🟠 Abierto

La planificación y la POC no coinciden en varios puntos. Cada divergencia no resuelta es una
discusión que va a aparecer a mitad de la implementación:

| Tema            | Planificación                  | POC                                                |
| --------------- | ------------------------------ | -------------------------------------------------- |
| Bundler         | Rsbuild → **corregido a Vite** | Vite + `@module-federation/vite`                   |
| Gestor de paq.  | pnpm **10**                    | npm workspaces                                     |
| Node            | `> 22.18.0`                    | `^20.19.0 \|\| >=22.12.0`                          |
| Config de MF    | `rsbuild.config.ts`            | `module-federation.config.ts` + `vite.config.ts`   |
| Proxy de sesión | `server.proxy` de Rsbuild      | `server.proxy` de Vite (equivalente)               |
| Bridge          | `createBridgeComponent`        | expone `RouteRecordRaw[]` (más simple, sin bridge) |

- **Nota sobre el último punto:** la planificación asume `createBridgeComponent`, pensado para
  montar una **app** completa del remote. La POC expone un `RouteRecordRaw[]`, lo que da una
  sola instancia de router y navegación derivada automáticamente — más simple y con menos
  superficie de contrato. Vale evaluar cuál se adopta como estándar **antes** del primer
  remote real, porque cambiarlo después toca todos los remotes.
- **Mitigación:** actualizar el documento de planificación para que refleje el stack de la
  POC, o justificar por escrito cada divergencia. Una sola fuente de verdad.
- **Dueño:** Tamy

---

## Revisión

Este registro se revisa **al cierre de cada fase** del
[plan de implementación](plan-implementacion-peoplefirst.md), y ante cualquier incidente en
producción relacionado con la composición de microfrontends.

Los riesgos **Abiertos** de nivel 🔴 son los que deben tener dueño y fecha antes de empezar
la Fase 2: **R6, R15, R16, R17**.

Cambios desde la primera versión de este registro:

- **R11** (dos lockfiles) → **Resuelto** por la migración a pnpm 10 ([ADR 0003](adr/0003-pnpm.md)).
- **R7** (lockfile único acopla los pipelines) → **Mitigado**: con pnpm el install baja al
  subgrafo real de cada app.
- **R1** (acoplamiento de versiones) → **Mitigado**: Syncpack cierra el agujero de rangos
  divergentes entre apps ([ADR 0004](adr/0004-syncpack-renovate.md)).
- **R8** reformulado: la causa que se le atribuía (el hoisting de npm) era incorrecta. La
  medición encontró otra cosa — el grafo de chunks federados depende del install.
