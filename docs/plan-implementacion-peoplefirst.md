# Plan de implementación — Microfrontend PeopleFirst

**Objetivo:** desacoplar el frontend de `monolith-do-core` de forma incremental, sin
reescritura Big Bang, usando un monorepo con Module Federation.

**Base técnica:** la POC `pokedex-vuejs` de este repositorio. No es una demo desechable: el
shell, el contrato federado, la degradación ante remotes caídos, el guard de singletons y el
pipeline de verificación ya están funcionando y con tests. La implementación en PeopleFirst
**porta** estos patrones, no los reinventa.

**Documentos relacionados**

- [Por qué monorepo](monorepo-vs-multirepo.md) — la decisión y sus objeciones
- [ADR 0001 — MF en monorepo](adr/0001-module-federation-en-monorepo.md) — reglas de arquitectura
- [ADR 0002 — Turborepo](adr/0002-turborepo.md) — grafo de tareas y cache
- [Registro de riesgos](riesgos.md) — R1–R22, con señales de alerta y dueños

---

## Resumen ejecutivo

| Fase | Semanas | Foco                                        | Entregable que la cierra                                                 |
| ---- | ------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| 0    | —       | POC validada                                | ✅ Hecho: 3 apps, 65 unit tests, 12 E2E contra builds, Turborepo         |
| 1    | 1–2     | Destrabar bloqueantes e infraestructura     | JWT validado en DEP + playbook de SRE firmado + entorno local del equipo |
| 2    | 2–3     | HOST / shell                                | Shell en DEP cargando un remote de prueba, con degradación probada       |
| 3    | 3–4     | Estandarización de remotes                  | Plantilla de remote + aislamiento de estilos + primer remote real        |
| 4    | 4+      | Migración progresiva (patrón estrangulador) | Reconocimientos en producción tras feature flag                          |

**Camino crítico:** JWT (R15) → HOST → primer remote. Todo lo demás es paralelizable.

**La vía de escape si JWT se atrasa:** el módulo KPI sale como **Web Component** embebido en
el monolito con una etiqueta HTML estándar, sin depender del nuevo HOST. Desacopla el avance
de producto del bloqueante de infraestructura.

---

## Fase 0 — Lo que la POC ya resolvió ✅

Antes de planificar trabajo nuevo, conviene ser explícito sobre qué **no** hay que volver a
resolver. Todo esto está en `pokedex-vuejs`, con tests:

| Patrón                                         | Dónde vive                                              | Se porta a PeopleFirst como                  |
| ---------------------------------------------- | ------------------------------------------------------- | -------------------------------------------- |
| Contrato federado mínimo (`RouteRecordRaw[]`)  | `apps/remote-*/module-federation.config.ts`             | Contrato estándar de todos los remotes       |
| Singletons en un solo lugar + guard            | `packages/mf-shared/` + `tests/shared-contract.spec.ts` | Igual, tal cual                              |
| Degradación ante remote caído                  | `src/base/config/router/` + `e2e/remote-outage.spec.ts` | `offlineHandlingPlugin` + `ErrorMfeTemplate` |
| Navegación derivada de las rutas montadas      | `usePublicLayoutViewModel.ts` (`meta.navLabel`)         | Igual — agregar un remote no toca el host    |
| CSS que viaja con el contrato                  | `import '@/assets/main.css'` en el módulo expuesto      | Igual, + `postcss-prefix-selector`           |
| Verificación contra **builds**, no dev servers | `test:e2e:preview` en CI                                | **No negociable** en el pipeline             |
| Fronteras entre capas verificadas              | `eslint-plugin-boundaries` por app                      | Igual                                        |
| Grafo de tareas y cache                        | `turbo.json`                                            | Igual                                        |
| Smoke test de artefactos federados             | `scripts/smoke-federation.mjs`                          | Igual, + smoke post-deploy contra el bucket  |

**Lecciones de la POC que cambian el plan original:**

1. **El `exposes` es un `RouteRecordRaw[]`, no un `createBridgeComponent`.** Da una sola
   instancia de router, navegación derivada automáticamente y menos superficie de contrato.
   Decisión a confirmar antes del primer remote real (riesgo
   [R22](riesgos.md#r22--deriva-entre-la-poc-y-la-planificación-🟠-abierto)).
2. **Vite, no Rsbuild.** Ya corregido en la planificación. Unifica el stack de compilación con
   `@module-federation/vite`.
3. **Los dev servers mienten.** Un dev server no minifica ni chunkea, así que el contrato
   `shared` nunca se negocia de verdad. Y el grafo de chunks federados **cambia según el
   gestor de paquetes** (medido: npm fundía el fallback de Vue dentro del chunk de colada;
   pnpm emite uno por dependencia). El único job que prueba la composición real es el E2E
   contra builds — y tiene que correr sobre el mismo install que produce el artefacto de
   producción. Riesgos
   [R8](riesgos.md#r8--el-dev-server-no-ejercita-el-contrato-shared-🔴-mitigado) y
   [ADR 0003](adr/0003-pnpm.md).
4. **La URL del remote horneada en el build del host es deuda, no diseño.** Hay que resolverla
   en Fase 2, antes del segundo remote en producción. Riesgo
   [R6](riesgos.md#r6--url-de-los-remotes-horneada-en-el-build-del-host-🔴-abierto).

---

## Fase 1 — Preparación y prerrequisitos (semanas 1–2)

Antes de escribir código en el HOST hay que destrabar los bloqueantes y configurar la
infraestructura base. **Nada de la Fase 2 en adelante avanza sin 1.1 y 1.2.**

### 1.1 Autenticación JWT · 🔴 bloqueante

Implementar y validar autenticación por JWT: es el requisito para que el HOST y los remotes
gestionen la sesión del usuario.

- **Entregable:** JWT emitido y validado en un ambiente DEP, con un flujo de refresh definido.
- **Criterio de aceptación:** el HOST puede leer la sesión y un remote puede llamar a un
  endpoint autenticado sin lógica de auth propia.
- **Dueño:** Backend
- **Mitigación de atraso:** definir en la **semana 1** un stub de sesión con la misma interfaz
  que tendrá el real, para que el trabajo de Fase 2 que no depende de JWT (shell, router,
  singletons, manejo de errores) avance en paralelo. Y activar la vía Web Component para KPI.
- **Riesgo:** [R15](riesgos.md#r15--jwt-es-bloqueante-de-todo-el-roadmap-🔴-abierto)

### 1.2 Coordinación con SRE · 🔴 bloqueante

SRE participa **solo en la creación inicial** del HOST, lo que concentra todo el riesgo en un
hito temprano. Por eso la reunión tiene que ser **una** conversación con una lista cerrada.

**Los 7 requerimientos, cerrados:**

1. **Dominio propio e independiente** en el proyecto de GCP del clúster, separado del dominio
   e infraestructura de `talana.com`. Permite desacoplar los frontends pensando en la fusión
   People First / Rex+.
2. **HOST aislado en su propio recurso de GCP**, no colgado del Load Balancer web tradicional,
   para evitar latencias de _first hit_ y pantallas en blanco por lectura directa de buckets.
   → Riesgo [R20](riesgos.md#r20--pantalla-en-blanco-en-el-first-hit-del-host-🟠-abierto)
3. **Bucket centralizado** con estructura `gs://<bucket>/<env>/<app>/`. Cada remote se
   despliega en su subcarpeta, de forma independiente.
4. **CORS en el bucket:** `Access-Control-Allow-Origin` para el dominio del host. Sin esto el
   `import()` de `remoteEntry.js` falla siempre. → [R17](riesgos.md#r17--cors-y-cache-headers-mal-configurados-en-el-bucket-🔴-abierto)
5. **Cache headers:**
   - `remoteEntry.js` y `mf-manifest.json` → TTL corto o `no-cache`
   - chunks con hash → `immutable, max-age=31536000`

   Cachear el entry de forma agresiva significa desplegar un remote nuevo y que el host siga
   viendo el viejo, indefinidamente. → [R17](riesgos.md#r17--cors-y-cache-headers-mal-configurados-en-el-bucket-🔴-abierto)

6. **Inyección de configuración en runtime** para la tabla de remotes (un `remotes.json`
   servido, o `window.__MF_REMOTES__` inyectado por Nginx). Es lo que elimina el rebuild del
   host al mover un remote. → [R6](riesgos.md#r6--url-de-los-remotes-horneada-en-el-build-del-host-🔴-abierto)
7. **Fallback de Nginx a `index.html`** en las rutas del host: Web History (sin `#`) lo
   requiere, o un refresh en una ruta profunda da 404.

**Más:** playbook de Terraform + Nginx, pipelines de GitHub Actions, URLs de prueba en DEP, y
quién puede escribir en el bucket y desde qué pipeline.

- **Entregable:** playbook escrito y bucket + dominio creados en DEP.
- **Criterio de aceptación:** un `curl -I` contra el bucket devuelve los headers de CORS y
  cache esperados, y un artefacto de prueba se sirve correctamente.
- **Dueño:** Tamy (coordinación) · SRE (ejecución)
- **Riesgo:** [R16](riesgos.md#r16--dependencia-de-sre-en-el-camino-crítico-🔴-abierto)

### 1.3 Entorno local de desarrollo

- **Gestor de paquetes: decidido y ya hecho en la POC.** Se migró a **pnpm 10**, se eliminó
  `package-lock.json` y se fijó `packageManager`. Cierra
  [R11](riesgos.md#r11--dos-lockfiles-en-el-repo-🟠-resuelto) y alinea la POC con la
  planificación. Medición y detalle en el [ADR 0003](adr/0003-pnpm.md).
  - _Ojo con la razón equivocada:_ pnpm **no** hace que los fallos de singleton dejen de
    esconderse en dev — era una creencia y la medición la desmintió. Lo que sí encontró es que
    el grafo de chunks federados cambia según el install, lo que vuelve el E2E contra builds
    más importante, no menos
    ([R8](riesgos.md#r8--el-dev-server-no-ejercita-el-contrato-shared-🔴-mitigado)).
- **Versión de Node:** sigue abierta. La POC declara `^20.19.0 || >=22.12.0`; la planificación
  pide `> 22.18.0`. Alinear `engines` y el `NODE_VERSION` del CI con lo que pida SRE.
- **HTTPS local:** certificados con `mkcert` (ej. `mfe.talana.dev`), mapeados en `/etc/hosts`,
  para habilitar el desarrollo cruzado entre host y remotes.
- **Turborepo:** ya configurado en este repo. Se copia `turbo.json` y los scripts raíz.
- **Entregable:** un `README` de arranque que un dev nuevo siga en < 15 min: un clone, un
  install, `pnpm dev` y el sistema completo en local.
- **Dueño:** Frontend

### Salida de Fase 1

- [ ] JWT validado en DEP (o stub de sesión definido y vía Web Component activa)
- [ ] Playbook de SRE escrito; dominio y bucket creados en DEP, con CORS y cache verificados
- [x] Gestor de paquetes decidido (pnpm 10) y lockfile duplicado eliminado
- [ ] Versión de Node alineada con SRE
- [ ] HTTPS local funcionando para todo el equipo

---

## Fase 2 — HOST / shell (semanas 2–3)

El HOST es **una caja contenedora**, no una aplicación. Su trabajo: layout, router,
instalación de plugins y orquestación de la carga dinámica. Si crece más que eso, algo está
mal ubicado.

> **Shell ligero:** si hay elementos comunes (header, sidebar), se exportan como
> subaplicaciones remotas reutilizables en vez de vivir dentro del host.

### 2.1 Inicialización con Vite

`@rsbuild/core` queda descartado: se usa **Vite + `@module-federation/vite`**, unificando el
stack de compilación con el de los remotes. Se porta la estructura de `apps/host` de la POC.

### 2.2 Enrutamiento

- **Web History**, no Hash History: URLs limpias, sin `/#/`. Requiere el fallback de Nginx
  del punto 1.2.7.
- **Ruteo dinámico por dominio** con un composable (`useRouterSelector.ts`) que decide qué mapa
  de rutas cargar según `window.location.host`.
- **Rutas disjuntas** respecto del monolito, desde el primer día.
  → [R18](riesgos.md#r18--doble-manejador-de-rutas-monolito-php-vs-router-del-host-🟠-abierto)
- **Navegación derivada:** cada remote declara `meta: { navLabel: '…' }` en su ruta de listado
  y el host construye la barra a partir de las rutas montadas. **Agregar un remote no toca el
  host.** Ya funciona en la POC.

### 2.3 Singletons y estado

`vue`, `vue-router`, `pinia` y `@pinia/colada` con `singleton: true`, declarados en **un solo
lugar** (`packages/mf-shared`) e importados por las tres configs. Dos copias de Vue = dos
sistemas de reactividad; dos routers = las pantallas del remote nunca ven la navegación del
host.

**El host es dueño de los plugins.** Solo existe una instancia de app y es la suya:
`app.use(createPinia())`, `app.use(PiniaColada, coladaOptions)`. Un remote que llama a
`useQuery()` asume que ya están instalados.

**No** llevan `import: false`: conservar el fallback local de cada app es lo que permite
correr un remote standalone, sin host.

> **`eager: true` — decisión pendiente.** La planificación original lo pedía. La POC no lo usa,
> y con carga dinámica del contrato el `eager` fuerza a incluir los singletons en el chunk
> inicial de cada app, lo que engorda el arranque. Medir antes de activarlo.

### 2.4 Resiliencia · el punto que más se subestima

`offlineHandlingPlugin` (plugin de runtime) + componente `ErrorMfeTemplate`. Si un remote se
cae, el HOST captura el error y muestra un aviso **sin romper el resto**.

La POC ya tiene el patrón funcionando: `import()` dinámico + `Promise.allSettled` en
`registerRemoteRoutes()`, con fallback por remote. Un remote caído degrada **solo su sección**
—queda en la barra y su ruta base explica qué pasó— y está cubierto por un E2E que aborta el
tráfico a su origen.

Con imports estáticos, un remote caído dejaba el `#app` en 0 bytes: sin navbar, y el otro
remote inaccesible aunque estuviera sano. Es la diferencia entre una sección degradada y una
caída total.

### 2.5 Resolución de remotes en runtime · 🔴 hacer acá, no después

Consumir el mecanismo del punto 1.2.6 en vez de hornear las URLs con `VITE_REMOTE_*_ENTRY`.
Hacerlo con un solo remote es un cambio chico; hacerlo con seis en producción es una migración
coordinada. → [R6](riesgos.md#r6--url-de-los-remotes-horneada-en-el-build-del-host-🔴-abierto)

### 2.6 Skeleton en el `index.html`

Un loader inline —no un `<div id="app">` vacío— para que el primer paint no sea blanco aunque
la red tarde. Complementa el aislamiento de infraestructura del punto 1.2.2.
→ [R20](riesgos.md#r20--pantalla-en-blanco-en-el-first-hit-del-host-🟠-abierto)

### Salida de Fase 2

- [ ] Shell desplegado en DEP, sirviendo Web History con fallback de Nginx funcionando
- [ ] Un remote de prueba cargado desde el bucket, no desde localhost
- [ ] Tabla de remotes resuelta en **runtime**: cambiar la URL de un remote no requiere
      rebuild del host
- [ ] E2E de degradación en verde: con el remote caído, el shell arranca y avisa
- [ ] Job de E2E contra **builds** corriendo en CI y bloqueando el merge
- [ ] Decisión tomada sobre `eager: true`, con medición

---

## Fase 3 — Estandarización de remotes (semanas 3–4)

Que el segundo remote sea trivial de crear es el criterio de éxito de esta fase.

### 3.1 Plantilla de remote (Vue 3 + Vite), con dos entry points

| Entry               | Para qué                                                          |
| ------------------- | ----------------------------------------------------------------- |
| `src/main.ts`       | Modo **standalone**: correr y depurar el remote solo, sin host    |
| `src/export-app.ts` | Modo **MF**: exporta la subaplicación para que la consuma el HOST |

**Decisión de contrato a confirmar:** la planificación asume `createBridgeComponent` (montar
una app completa del remote). La POC expone un `RouteRecordRaw[]`, lo que da una sola
instancia de router, navegación derivada y menos superficie de contrato. Elegir **antes** del
primer remote real: cambiarlo después toca todos los remotes.
→ [R22](riesgos.md#r22--deriva-entre-la-poc-y-la-planificación-🟠-abierto)

Lo que **no** cruza la frontera, en cualquiera de los dos casos: entidades, casos de uso,
ports, adapters HTTP, contenedores de DI, mappers, presentation models. El `exposes` es a un
microfrontend lo que una API REST es a un microservicio.

### 3.2 Aislamiento de estilos

- `postcss-prefix-selector` para encapsular el CSS del remote bajo un ID único
  (`#remote-app-kpi`).
- Prefijos de Tailwind por app (`kpi:`, `host:`) para que las utilidades no se pisen.
- El CSS **viaja con el contrato**: el módulo expuesto importa su propio stylesheet, así
  funciona igual en federado y standalone (patrón de la POC).
- **Añadir:** un E2E que cargue dos remotes en la misma página y verifique una propiedad
  computada clave de cada uno. Sin eso, la colisión aparece en producción.
- **Caso especial:** el preflight de Tailwind no lleva prefijo y se inyecta una vez por app.
  Con más de ~5 remotes, moverlo a una hoja única del host.
  → [R19](riesgos.md#r19--colisión-de-estilos-entre-remotes-y-con-el-legacy-🟠-abierto),
  [R9](riesgos.md#r9--preflight-de-tailwind-duplicado-n-en-la-misma-página-🟡-vigilado)

### 3.3 Extracción de componentes comunes

Header, sidebar y otros elementos compartidos salen como **subaplicaciones remotas
independientes**. El host los consume; no duplica código.

> **Ojo:** esto es un remote, **no** un paquete en `packages/`. Un paquete de runtime
> compartido se bundlea en cada consumidor (N copias, N copias de cualquier estado a nivel de
> módulo) y su versión de workspace `0.0.0` vuelve sin sentido la negociación de
> `requiredVersion`. `packages/` es solo para metadata de build-time.
> → [R5](riesgos.md#r5--shared-degenera-en-mini-monolito-interno-🔴-mitigado)

### 3.4 Pipeline de deploy por remote

```bash
VITE_PUBLIC_PATH=https://cdn.<dominio>/<env>/remote-kpi/ \
  pnpm exec turbo run build --filter=remote-kpi
gsutil -m rsync -r apps/remote-kpi/dist gs://<bucket>/<env>/remote-kpi
```

Tres cosas que hay que hacer bien:

1. **`VITE_PUBLIC_PATH` es obligatorio en producción.** El host carga estos chunks desde otro
   origen; con rutas relativas el navegador las resolvería contra el origen del host → 404.
2. **La variable tiene que estar declarada en `turbo.json → tasks.build.env`** (ya lo está).
   Si no, turbo devolvería un build cacheado con la URL del CDN equivocada: 404 en runtime,
   CI en verde. → [R12](riesgos.md#r12--cache-de-turbo-envenenado-por-env-vars-no-declaradas-🔴-mitigado)
3. **Smoke test post-deploy:** un `curl -I` que verifique `Access-Control-Allow-Origin` y
   `Cache-Control` del `remoteEntry.js`, más un `grep` de la URL esperada dentro del bundle.

### Salida de Fase 3

- [ ] Plantilla de remote documentada, con los dos entry points
- [ ] Contrato estándar decidido y escrito (`RouteRecordRaw[]` vs `createBridgeComponent`)
- [ ] Aislamiento de estilos verificado por un E2E con dos remotes en la misma página
- [ ] Header/sidebar extraídos como remote, si aplica
- [ ] Pipeline de deploy por remote con smoke test post-deploy
- [ ] **Prueba del criterio de éxito:** crear un remote vacío nuevo y montarlo en el host lleva
      menos de un día, sin tocar código del host

---

## Fase 4 — Migración progresiva: patrón estrangulador (semana 4+)

### El patrón, en corto

Estrategia para modernizar sistemas legados de forma gradual, inspirada en la planta que crece
alrededor de un árbol hasta reemplazarlo. En vez de una reescritura Big Bang que paralice las
entregas, el HOST va envolviendo las rutas del monolito PHP **pantalla por pantalla**.

- **Coexistencia en runtime.** El monolito PHP y los microfrontends Vue 3 conviven de forma
  transparente para el usuario.
- **Enrutamiento inteligente.** El HOST recibe las peticiones: si la ruta ya existe como
  remote, la renderiza el MF; si no, la sigue entregando el monolito.
- **Reuso de contratos de API.** Las subaplicaciones consumen los **mismos** endpoints
  REST/GraphQL que ya usa el monolito. No se reescribe el backend durante la migración del
  frontend.
- **Mitigación de riesgo.** Se migran primero las vistas de menor impacto. Si un MF falla, un
  **feature flag** devuelve la ruta al monolito.
- **Resultado final.** Al completar la migración, los `blade.php` se eliminan y el monolito
  queda relegado a API de servicios.

### 4.1 Proxy de sesión

Configurar `server.proxy` en la config del HOST para gestionar la reescritura de cookies entre
dominios, de modo que el entorno legacy y el nuevo compartan la sesión del usuario de forma
transparente mientras dure la coexistencia.

### 4.2 Rutas disjuntas

Esquemas de URL únicos y **sin solape** para las subaplicaciones del HOST, para evitar
colisiones o dobles manejadores entre el router del monolito y el del MF.

**Hacerlo verificable:** un test que compare la tabla de rutas del host contra la lista de
rutas que sigue sirviendo el monolito y falle si hay intersección. Sin eso, el solape se
descubre como "esta URL se comporta distinto según si llego por link o por refresh".
→ [R18](riesgos.md#r18--doble-manejador-de-rutas-monolito-php-vs-router-del-host-🟠-abierto)

### 4.3 Flujo de migración, vista por vista

```
1. Elegir una vista del monolito
2. Desarrollar su equivalente en Vue 3 dentro del MFE correspondiente
3. Conectarla a los servicios backend existentes, sin modificar contratos de datos
4. Actualizar la tabla de rutas del HOST para derivar esa vista al remote
5. Validar en QA/Staging detrás de feature flag
6. Promover a producción con el flag activo para un subconjunto de tenants
7. Ampliar el flag gradualmente
```

**El flag se evalúa en runtime, no en build-time.** Un flag compilado no sirve para revertir
sin deploy, que es justamente para lo que existe.

### 4.4 Desactivación de vistas legacy

Una vez validado en producción sin incidencias, coordinar con backend la eliminación o
desactivación del enrutamiento de la plantilla PHP correspondiente.

**Regla operativa:** no borrar la plantilla legacy hasta que el flag lleve al menos **un ciclo
de release completo** al 100% sin incidencias. El flag es la red de seguridad; borrar el
legacy es sacarla.

### 4.5 Orden de migración

| #   | Módulo                       | Estado del backend       | Notas                                                                                                                                                                              |
| --- | ---------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Reconocimientos** (Tony)   | Ya migrado a MVC         | Submódulos: Reconocer, Reconocimientos, Reconocimientos por validar, Productos, Mis canjes, Reportes. **Sin Figma** → actualizar a componentes equivalentes (consultar con Ambar). |
| 2   | **Clima** (Claudio)          | El más legacy            | **Sin Figma.** Gráficos con **ApexCharts** estilados según el estándar Talana.                                                                                                     |
| 3   | **Nuevas vistas por tenant** | Configuración de empresa | Web Component dentro de un tag HTML: según flag se monta legacy o nuevo.                                                                                                           |

**Por qué este orden:** Reconocimientos primero porque su backend ya está en MVC — menos
incógnitas, y sirve para validar el flujo completo de migración con el menor riesgo. Clima
segundo porque es el más legacy: conviene atacarlo cuando el flujo ya esté rodado.

**Pendiente antes de arrancar #1:** sin Figma, definir con Ambar el criterio de equivalencia
visual. "Componentes equivalentes" sin criterio escrito es una discusión de review por cada
pantalla.

### 4.6 La vía Web Component (paralela, no secuencial)

Para no frenar el desarrollo del módulo **KPI** mientras se resuelve JWT, la vista de Vue 3 se
exporta como **Web Component agnóstico** y se embebe temporalmente dentro del monolito con una
etiqueta HTML estándar, sin depender aún del nuevo HOST.

**Trade-off explícito:** un Web Component no comparte router ni singletons con el host. Es un
puente táctico, no la arquitectura destino. Cuando JWT esté listo, esa vista se convierte en un
remote normal. Conviene mantener la lógica de dominio separada del wrapper de Web Component
para que la conversión sea cambiar el entry point, no reescribir la vista.

### Salida de Fase 4 (por módulo)

- [ ] Vista equivalente en Vue 3, consumiendo los mismos endpoints
- [ ] Rutas disjuntas verificadas por test
- [ ] Feature flag evaluado en runtime, con reversa probada
- [ ] Validado en QA/Staging, luego producción por tenants
- [ ] Un ciclo de release completo al 100% sin incidencias
- [ ] Plantilla PHP desactivada, coordinado con backend

---

## Decisiones abiertas

Cada una es una discusión que va a aparecer a mitad de la implementación si no se cierra
antes. → [R22](riesgos.md#r22--deriva-entre-la-poc-y-la-planificación-🟠-abierto)

| #   | Decisión                                                                  | Cerrar antes de          | Dueño            |
| --- | ------------------------------------------------------------------------- | ------------------------ | ---------------- |
| 1   | ~~npm vs pnpm 10~~ **cerrada:** pnpm 10, ver [ADR 0003](adr/0003-pnpm.md) | ✅ hecha                 | Frontend         |
| 2   | Versión de Node (`>=22.12` vs `>22.18`)                                   | Fase 1                   | Frontend + SRE   |
| 3   | Contrato: `RouteRecordRaw[]` vs `createBridgeComponent`                   | Fase 3                   | Frontend         |
| 4   | `eager: true` en los singletons (medir primero)                           | Fase 2                   | Frontend         |
| 5   | Mecanismo de config en runtime: `remotes.json` vs `window.__MF_REMOTES__` | Fase 1 (con SRE)         | Frontend + SRE   |
| 6   | Remote Cache de Turborepo: Vercel vs self-hosted                          | Cuando CI > 10 min       | Frontend + SRE   |
| 7   | Criterio de equivalencia visual sin Figma                                 | Antes de Reconocimientos | Ambar + Frontend |

## Riesgos que deben tener dueño y fecha antes de la Fase 2

**R6** (URL horneada) · **R15** (JWT bloqueante) · **R16** (SRE en camino crítico) ·
**R17** (CORS y cache headers)

Detalle completo en el [registro de riesgos](riesgos.md).
