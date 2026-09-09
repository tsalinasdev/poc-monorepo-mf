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

| Patrón                                         | Dónde vive                                                                                      | Se porta a PeopleFirst como                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Contrato federado (`./export-app` con bridge)  | `apps/remote-*/src/export-app.ts` + `module-federation.config.ts`                               | Contrato estándar de todos los remotes (decidido en [ADR 0005](adr/0005-bridge-y-manifest-como-contrato.md)) |
| Singletons en un solo lugar + guard            | `packages/mf-shared/` + `tests/shared-contract.spec.ts`                                         | Igual, tal cual                                                                                              |
| Degradación ante remote caído                  | `src/base/config/router/` + `e2e/remote-outage.spec.ts`                                         | `offlineHandlingPlugin` + `ErrorMfeTemplate`                                                                 |
| Catálogo de remotes en el host                 | `apps/host/src/base/config/router/remotes.ts`                                                   | Igual — el `navLabel` vive acá, no en las rutas del remote                                                   |
| Carga vía `mf-manifest.json`                   | `apps/host/module-federation.config.ts` apunta a `mf-manifest.json`; runtime usa `loadRemote()` | Igual, + resolver la URL del manifest en runtime para mover un remote sin rebuild                            |
| CSS que viaja con el contrato                  | `import '@/assets/main.css'` en el módulo expuesto                                              | Igual, + `postcss-prefix-selector`                                                                           |
| Verificación contra **builds**, no dev servers | `test:e2e:preview` en CI                                                                        | **No negociable** en el pipeline                                                                             |
| Fronteras entre capas verificadas              | `eslint-plugin-boundaries` por app                                                              | Igual                                                                                                        |
| Grafo de tareas y cache                        | `turbo.json`                                                                                    | Igual                                                                                                        |
| Smoke test de artefactos federados             | `scripts/smoke-federation.mjs`                                                                  | Igual, + smoke post-deploy contra el bucket                                                                  |

**Lecciones de la POC que cambian el plan original:**

1. **El `exposes` es un `RouteRecordRaw[]`, no un `createBridgeComponent`.** Da una sola
   instancia de router, navegación derivada automáticamente y menos superficie de contrato.
   Decisión a confirmar antes del primer remote real (riesgo
   [R22](riesgos.md#r22--deriva-entre-la-poc-y-la-planificación-🟢-cerrado)).
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
   → Detalle operativo en [1.4](#14-producción--arquitectura-cloud-cdn--cloud-storage);
   riesgo [R20](riesgos.md#r20--pantalla-en-blanco-en-el-first-hit-del-host-🟠-abierto)
3. **Bucket centralizado** con estructura `gs://<bucket>/<env>/<app>/` servido detrás de
   **Google Cloud CDN**. Cada remote se despliega en su subcarpeta, de forma independiente.
   → Topología, headers y pipeline en [1.4](#14-producción--arquitectura-cloud-cdn--cloud-storage)
4. **CORS en el bucket:** `Access-Control-Allow-Origin` para el dominio del host. Sin esto el
   `import()` de `remoteEntry.js` falla siempre. → Contrato completo en
   [1.4.4](#144-contrato-de-headers--cloud-storage);
   [R17](riesgos.md#r17--cors-y-cache-headers-mal-configurados-en-el-bucket-🔴-abierto)
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

### 1.4 Producción — arquitectura Cloud CDN + Cloud Storage

La POC despliega cada app a su propio `dist/`; en producción, cada `dist/` se publica en
**Google Cloud Storage** y se sirve al navegador a través de **Google Cloud CDN**. Esta sección
fija la topología, los contratos de headers/CORS, el pipeline de build→deploy y los smoke tests
post-deploy. Los siete requerimientos cerrados de la 1.2 son el subconjunto mínimo: esto los
expande con el detalle operativo que SRE va a necesitar para escribir el playbook.

#### 1.4.1 Topología

Un único **proyecto GCP**, un único **bucket** por entorno (`dev`, `stg`, `prod`) y una única
**Cloud CDN** configurada como _backend_ del balanceo del dominio público.

```
                                            ┌──────────────────────────────┐
   Browser                                  │  Cloud CDN (HTTPS)           │
       │                                    │  ┌────────────────────────┐  │
       │  ┌──── mfe.<dominio>  ───────────► │  │ Origin: gs://bucket    │  │
       │  │   (host shell + remoteEntry)    │  │ Cache keys por path     │  │
       │  │                                 │  └────────────────────────┘  │
       │  └── cdn.<dominio>/<env>/<app>/   │            ▲                  │
       │       (chunks de cada remote)     └────────────│──────────────────┘
       │                                             │
                                                     │ gsutil rsync
                                                     ▼
                                          ┌──────────────────────────┐
                                          │  Cloud Storage           │
                                          │  gs://<bucket>/<env>/    │
                                          │    <app>/                │
                                          │    ├── index.html        │
                                          │    ├── remoteEntry.js    │
                                          │    ├── mf-manifest.json  │
                                          │    └── assets/…          │
                                          └──────────────────────────┘
```

- **`mfe.<dominio>`** sirve el shell (host). Es la URL pública que el usuario ve en la barra
  de direcciones. Aislada del Load Balancer web tradicional de `talana.com` para evitar el
  first-hit en blanco descrito en [R20](riesgos.md#r20--pantalla-en-blanco-en-el-first-hit-del-host-🟠-abierto).
- **`cdn.<dominio>/<env>/<app>/`** sirve los artefactos federados. Cada remote se publica en
  su propia subcarpeta del bucket; los chunks federados (incluido el `remoteEntry.js`) viven
  en esa misma subcarpeta, no en un bucket por app. Ver Fase 3.4.
- **Una sola Cloud CDN** delante de ambos hosts lógicos. Distingue por _hostname_:
  `Host: mfe.<dominio>` → origin del shell; `Host: cdn.<dominio>` → origin del bucket completo.
  Reducir a una CDN simplifica la invalidación y los logs.

#### 1.4.2 Estructura del bucket

```
gs://<bucket>/<env>/
├── host/                    ← dist/ de apps/host
│   ├── index.html
│   ├── favicon.ico
│   └── assets/
│       ├── index-<hash>.js
│       └── index-<hash>.css
├── remote-pokemon/          ← dist/ de apps/remote-pokemon
│   ├── remoteEntry.js
│   ├── mf-manifest.json
│   └── assets/
│       ├── remoteEntry-<hash>.js
│       └── pokemon-<hash>.[js|css]
├── remote-dragonball/
└── remote-<futuro>/
```

- **Una carpeta por app, no un bucket por app.** Permite _deploys_ independientes con un solo
  origen configurado en la CDN, y un único IAM para escribir.
- **`remoteEntry.js` y `mf-manifest.json` viven al lado del `index.html` de cada remote**, no
  en una carpeta `entry/`. El host los pide por path absoluto
  (`https://cdn.<dominio>/<env>/remote-pokemon/remoteEntry.js`) y la ruta debe sobrevivir
  reorganizaciones: cambiar la convención es un breaking change para todos los remotes en
  producción.
- **Versionado implícito por nombre de archivo con hash.** No se mantienen versiones viejas
  explícitas en el bucket: `gsutil rsync -d` borra lo que el `dist/` local ya no trae. La
  reversión es `git revert` + redeploy, no "des-sincronizar a mano".

#### 1.4.3 Cloud CDN — configuración

| Parámetro                  | Valor                                                              | Por qué                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Origin**                 | `gs://<bucket>` (single bucket)                                    | Una sola fuente de verdad para el contenido estático. La CDN se configura contra el bucket, no contra un dominio interno.                          |
| **Protocol**               | HTTPS-only hacia el cliente; HTTP/2 al origin                      | TLS obligatorio. HTTP/2 porque los chunks federados son muchos requests chicos.                                                                    |
| **Cache mode**             | `CACHE_ALL_STATIC` con `default_ttl` conservador                   | El contenido del bucket es estático por definición. `default_ttl` no debe sustituir a los `Cache-Control` que pone el bucket — son la fuente real. |
| **Cache key**              | `Path` (no incluir query string ni headers)                        | Los chunks federados cambian de nombre en cada deploy; el path los identifica sin ambigüedad.                                                      |
| **Negative caching**       | Deshabilitado                                                      | Un 404 del bucket significa deploy roto o ruta mal escrita — no queremos que la CDN lo oculte.                                                     |
| **Signed URLs**            | No                                                                 | El contenido es público; la seguridad está en el shell (JWT y feature flags), no en ofuscar los chunks.                                            |
| **Compression**            | Habilitada (brotli para texto)                                     | `remoteEntry.js`, `mf-manifest.json` y los chunks JS/CSS son texto — la compresión gana, sin tocar nada en Vite.                                   |
| **Invalidación on-deploy** | `gcloud compute url-maps invalidate-cdn-cache` con path específico | Cada deploy invalida solo la subcarpeta del remote que cambió (`/<env>/<app>/*`), no el bucket entero. Ver 1.4.6.                                  |

#### 1.4.4 Contrato de headers — Cloud Storage

Los objetos se suben vía `gsutil -h` con los headers en línea, no via políticas del bucket.
Eso hace que el contrato sea **explícito y versionado en el playbook**, y portable a otro
origen sin reescribir configuración.

| Path                                      | `Cache-Control`                          | Por qué                                                                                                                                                                                           |
| ----------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/<env>/<app>/remoteEntry.js`             | `public, max-age=0, must-revalidate`     | El host debe ver la versión nueva apenas se publica. Cachear este archivo agresivamente = deploy fantasma. → [R17](riesgos.md#r17--cors-y-cache-headers-mal-configurados-en-el-bucket-🔴-abierto) |
| `/<env>/<app>/mf-manifest.json`           | `public, max-age=0, must-revalidate`     | Mismo motivo: MF lo consulta para resolver versiones de los chunks.                                                                                                                               |
| `/<env>/<app>/index.html`                 | `public, max-age=300, must-revalidate`   | El shell puede tolerar 5 min de stale; ayuda al first-hit sin pagar invalidación manual en cada deploy.                                                                                           |
| `/<env>/<app>/assets/<hash>.*`            | `public, max-age=31536000, immutable`    | El hash en el nombre ya es la versión; no hay razón para revalidar. Vite emite los chunks con hash por defecto.                                                                                   |
| `/<env>/host/**` (no aplica lo de arriba) | Mismos criterios que cualquier otro dist | El host no expone `remoteEntry.js`; sus assets sí siguen el patrón de hash.                                                                                                                       |

**CORS — también por header de objeto, no por configuración del bucket:**

```json
{
  "origin": ["https://mfe.<dominio>"],
  "method": ["GET", "HEAD", "OPTIONS"],
  "responseHeader": ["Content-Type", "Cache-Control", "Content-Length"],
  "maxAgeSeconds": 3600
}
```

Solo el host hace `import()` cross-origin hacia `cdn.<dominio>`. El bucket tiene que
responder con `Access-Control-Allow-Origin` para el dominio del shell, o el `import()`
falla siempre. → [R17](riesgos.md#r17--cors-y-cache-headers-mal-configurados-en-el-bucket-🔴-abierto)

> **Por qué por header de objeto y no por `gsutil cors set`:** la config de CORS del bucket
> es global; los headers por objeto pueden afinarse por subcarpeta vía `gsutil -h` en el
> comando de rsync. Si mañana el dominio cambia (nuevo entorno, merge People First / Rex+),
> el cambio es un valor en el playbook, no una reconfiguración del bucket.

#### 1.4.5 Pipeline de build → publish

El mismo playbook, parametrizado por entorno y por app:

```bash
# Variables que el pipeline exporta: ENV=stg|prod, APP=host|remote-pokemon|...
VITE_PUBLIC_PATH=https://cdn.<dominio>/${ENV}/${APP}/ \
  pnpm exec turbo run build --filter=${APP}

# Subida con headers por objeto (un solo rsync; CORS y cache vienen en cada archivo)
gsutil -m -h "Cache-Control:public, max-age=0, must-revalidate" \
          -h "Cache-Control:public, max-age=31536000, immutable" \
       rsync -r -d -x '.*\.map$' apps/${APP}/dist gs://<bucket>/${ENV}/${APP}
```

(En la práctica el playbook descompone el `-h` por path pattern vía `gsutil rsync -h`
_repeated_; el bloque de arriba es la versión legible.)

Tres cosas que tienen que quedar **explícitas** en el playbook:

1. **`VITE_PUBLIC_PATH` está declarada en `turbo.json → tasks.build.env`.** Sin esto, turbo
   devuelve desde cache un build con la URL del CDN del _otro_ entorno: el remote pide sus
   chunks al bucket equivocado, 404 en runtime, CI en verde. →
   [R12](riesgos.md#r12--cache-de-turbo-envenenado-por-env-vars-no-declaradas-🔴-mitigado)
2. **`--filter=${APP}` en turbo.** El cache por hash de inputs hace que cambiar un remote
   no recompile el host ni los demás. Si el playbook dice `turbo run build` a secas, todo se
   reconstruye aunque nada haya cambiado.
3. **`.map` excluido del rsync** (`-x '.*\.map$'`). Los source maps no deben servirse al
   público; si se necesitan para debug, van a un bucket separado con acceso restringido.

#### 1.4.6 Invalidación de caché post-deploy

Cada deploy dispara una invalidación **quirúrgica**, no un purge global:

```bash
gcloud compute url-maps invalidate-cdn-cache <nombre-del-url-map> \
  --path "/<env>/<app>/*" --async
```

- **Path específico del remote deployado**, no `/*`. Mantener el TTL del `index.html` en 5 min
  (1.4.4) cubre el caso normal sin pagar invalidación; el path explícito es para cuando se
  cambia `remoteEntry.js` y se necesita ver la nueva versión sin esperar.
- **Async** porque el deploy no debería bloquearse en la propagación. El smoke test post-deploy
  (1.4.7) valida que la invalidación se propagó, no el comando en sí.
- **Log en la CDN.** Toda invalidación queda registrada con su path y timestamp; eso da la
  trazabilidad que se necesita cuando se reporta "yo desplegué pero el browser seguía viendo
  la versión vieja" — el log dice si la invalidación corrió y cuánto tardó.

#### 1.4.7 Smoke tests post-deploy (obligatorios)

Dos niveles, los dos bloqueantes para cerrar un deploy:

**Nivel 1 — objeto en el bucket (curl directo, sin CDN):**

```bash
# remoteEntry.js del remote deployado
curl -sI "https://storage.googleapis.com/<bucket>/<env>/<app>/remoteEntry.js" \
  | grep -E "Access-Control-Allow-Origin|Cache-Control"
# Esperado:
#   Access-Control-Allow-Origin: https://mfe.<dominio>
#   Cache-Control: public, max-age=0, must-revalidate
```

**Nivel 2 — a través de Cloud CDN (curl contra el hostname público):**

```bash
# Mismo archivo, pero pasando por la CDN
curl -sI "https://cdn.<dominio>/<env>/<app>/remoteEntry.js" \
  | grep -E "Age|Cache-Control|HTTP/"
# Esperado en el primer hit:
#   HTTP/2 200
#   Cache-Control: public, max-age=0, must-revalidate
#   Age: 0
# Esperado en un hit posterior (dentro de los 5 min del index.html o después del must-revalidate):
#   Age: <segundos>
```

Un test de Playwright corriendo contra el entorno (no contra localhost) cierra la
verificación end-to-end: el host carga el `remoteEntry.js` real, importa una ruta del
remote y renderiza datos en vivo. Sin ese test, todo lo anterior puede estar en verde y el
usuario seguir viendo la versión vieja.

#### 1.4.8 First-hit — cómo esta arquitectura lo mitiga

El _first hit_ (cold start de la CDN para una ruta) introduce latencia porque la CDN tiene
que ir al bucket a buscar el objeto. Tres mitigaciones combinadas:

1. **TTL de `index.html` en 5 min** (1.4.4): el primer hit paga el round-trip, los
   siguientes 5 minutos no. La invalidación post-deploy lo refresca cuando hace falta.
2. **Pre-warm en el pipeline de deploy**: tras la invalidación, un `curl -o /dev/null` desde
   CI contra las rutas críticas (`/<env>/host/`, `/<env>/<app>/remoteEntry.js`) calienta
   la CDN. El usuario real nunca paga el cold start.
3. **Skeleton inline en el `index.html` del host** (ver
   [Fase 2.6](#26-skeleton-en-el-indexhtml)): aunque el primer paint tarde, no se ve una
   pantalla blanca. Esto complementa la mitigación de infra; las dos juntas cierran
   [R20](riesgos.md#r20--pantalla-en-blanco-en-el-first-hit-del-host-🟠-abierto).

#### 1.4.9 Resolución de remotes en runtime · contrato bridge + `mf-manifest.json`

La URL del remote **no** se hornea en el build del host (eso es deuda, no diseño). Con el
contrato nuevo —[`createBridgeComponent` + carga por `mf-manifest.json`, ver
[ADR 0005](adr/0005-bridge-y-manifest-como-contrato.md)— la tabla de remotes **no es un
artefacto aparte**: es el propio `mf-manifest.json` que cada remote ya emite en su build.

El host, en runtime, llama a `registerRemotes()` (`@module-federation/runtime`) por cada
remote:

```ts
import { registerRemotes, loadRemote } from '@module-federation/runtime'

registerRemotes([
  {
    name: 'remotePokemon',
    entry: 'https://cdn.<dominio>/<env>/remote-pokemon/mf-manifest.json',
  },
  {
    name: 'remoteDragonball',
    entry: 'https://cdn.<dominio>/<env>/remote-dragonball/mf-manifest.json',
  },
])

const RemotePokemonApp = await loadRemote<{ default: BridgeComponent }>('remotePokemon/export-app')
```

El `entry` apunta al **manifest**, no al `remoteEntry.js`: el runtime de MF descarga el
manifest primero, ve qué `exposes` tiene cada remote (incluido `./export-app`), y solo
entonces trae los chunks necesarios para cargar ese módulo. La URL del remote y su lista de
módulos viven en el mismo archivo que ya despliega el bucket del remote — **no se duplica**.

La URL del manifest vive en una variable de runtime (en el MVP de la POC, en
`apps/host/src/base/config/router/remotes.ts`; el siguiente paso es leerla de
`/remotes.json` propio del host, o de un endpoint de configuración). Cambiar la URL de un
remote es editar **un solo valor**; no requiere rebuild del shell. →
[R6](riesgos.md#r6--url-de-los-remotes-horneada-en-el-build-del-host-🔴-abierto) y
[Fase 2.5](#25-resolución-de-remotes-en-runtime--🔴-hacer-acá-no-después)

El `mf-manifest.json` se sirve con `Cache-Control: public, max-age=0, must-revalidate`
(como cualquier entry de remote en 1.4.4): el host debe ver el manifest nuevo apenas se
despliega, sino cachearía una tabla vieja que apunta a chunks ya reemplazados. La cache de
larga vida la llevan los chunks con hash.

#### 1.4.10 Salidas de 1.4 (para cerrar Fase 1)

- [ ] Bucket creado en GCP con la estructura de 1.4.2 y los headers de 1.4.4 aplicados vía
      `gsutil -h` (verificable con `curl -sI` como en 1.4.7)
- [ ] Cloud CDN configurada como _backend_ del balanceo de `cdn.<dominio>` y `mfe.<dominio>`
      (1.4.3), con un solo _url-map_ y dos _host rules_
- [ ] Tabla de remotes resuelta en runtime vía `registerRemotes()` con `mf-manifest.json` (1.4.9). `remotes.json` propio del host solo si se necesita override por entorno (ej. staging vs prod apuntan a buckets distintos)
- [ ] Pipeline parametrizado (1.4.5) corriendo desde CI con `--filter=${APP}` y exclusión de
      `.map`
- [ ] Invalidación post-deploy automatizada (1.4.6) con log
- [ ] Smoke tests de 1.4.7 corriendo en CI y bloqueando el deploy si fallan
- [ ] Pre-warm del pipeline ejecutándose tras cada deploy (1.4.8)
- [ ] CORS del bucket verificado con `curl -sI` y con un E2E Playwright real

### Salida de Fase 1

- [ ] JWT validado en DEP (o stub de sesión definido y vía Web Component activa)
- [ ] Playbook de SRE escrito; dominio y bucket creados en DEP, con CORS y cache verificados
- [ ] Cloud CDN + Cloud Storage operativos según [1.4](#14-producción--arquitectura-cloud-cdn--cloud-storage)
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

| Entry               | Para qué                                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `src/main.ts`       | Modo **standalone**: correr y depurar el remote solo, sin host                                                          |
| `src/export-app.ts` | Modo **MF**: envuelve la App con `createBridgeComponent` (`@module-federation/bridge-vue3`) para que la consuma el HOST |

**Decisión de contrato (cerrada):** **`createBridgeComponent` + carga por `mf-manifest.json`**.
La POC inicialmente expuso un `RouteRecordRaw[]`, pero la medición y la revisión cerraron
que el contrato correcto es el del plan: cada remote exporta **una App bridged** y el host la
carga a través del `mf-manifest.json`. Justificación completa y umbrales de reversión en
[ADR 0005](adr/0005-bridge-y-manifest-como-contrato.md). El riesgo
[R22](riesgos.md#r22--deriva-entre-la-poc-y-la-planificación-🟢-cerrado) queda cerrado con
este cambio.

Consecuencia operativa: el `navLabel` **deja de derivarse** de `meta.navLabel` en las rutas
del remote y pasa a vivir como dato en el catálogo del host
(`apps/host/src/base/config/router/remotes.ts`). El remote sigue dueño de su navegación
interna, pero el label y el orden de la barra son problema del shell (UX: idioma, copy,
orden) — no del remote.

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

- [ ] Plantilla de remote documentada, con los dos entry points (`main.ts` standalone + `export-app.ts` bridged)
- [ ] Contrato estándar decidido y escrito (`RouteRecordRaw[]` vs `createBridgeComponent`)
- [ ] Aislamiento de estilos verificado por un E2E con dos remotes en la misma página
- [x] Header/sidebar extraídos de la app de KPI, **si aplica** — cerrado en el cierre de la
      POC (2026-09-09), con un desvío consciente respecto a esta fase: en la POC el chrome
      compartido (Header, MainNavbar, Breadcrumbs portados de kpi-project) vive **en el
      host** (`apps/host/src/modules/shell/`), no como sub-aplicación remota. El plan de la
      Fase 2 define al HOST como dueño del layout, y para la POC es lo más simple: un remote
      de chrome agrega un salto federado más sin beneficio en un solo shell. Si PeopleFirst
      necesita que el chrome lo reutilicen varios hosts (fusión People First / Rex+), se
      extrae entonces como remote — el componente ya está aislado del contenido.
      Con el mismo cambio, el contenido de `kpi-project` corre como remote
      (`apps/remote-kpi`, port `5176`, base `/gestion-kpi`) y la librería de componentes
      `@talana/talanify-next` quedó instalada (host + remote-kpi, con su registry en
      `.npmrc`). El remote de Pokédex se quitó del POC: la navegación PeopleFirst
      queda entre `Gestión KPI` y `Dragon Ball`, con el landing del shell en
      `/gestion-kpi`.
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
antes. → [R22](riesgos.md#r22--deriva-entre-la-poc-y-la-planificación-🟢-cerrado)

| #   | Decisión                                                                                                                                                                                                                                                                                                                                                                                                                             | Cerrar antes de          | Dueño            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ | ---------------- |
| 1   | ~~npm vs pnpm 10~~ **cerrada:** pnpm 10, ver [ADR 0003](adr/0003-pnpm.md)                                                                                                                                                                                                                                                                                                                                                            | ✅ hecha                 | Frontend         |
| 2   | ~~Versión de Node~~ **cerrada (2026-09-07):** `>=22.0.0 <25.0.0` (rango 22–24 pedido por el equipo)                                                                                                                                                                                                                                                                                                                                  | ✅ hecha                 | Frontend + SRE   |
| 3   | ~~Contrato: `RouteRecordRaw[]` vs `createBridgeComponent`~~ **cerrada (2026-09-07):** `createBridgeComponent` + `mf-manifest.json`, ver [ADR 0005](adr/0005-bridge-y-manifest-como-contrato.md)                                                                                                                                                                                                                                      | ✅ hecha                 | Frontend         |
| 4   | `eager: true` en los singletons (medir primero)                                                                                                                                                                                                                                                                                                                                                                                      | Fase 2                   | Frontend         |
| 5   | ~~Mecanismo de config en runtime: `remotes.json` vs `window.__MF_REMOTES__`~~ **cerrada (2026-09-07):** se reemplaza por el propio `mf-manifest.json` que ya emite cada remote (ver [ADR 0005](adr/0005-bridge-y-manifest-como-contrato.md) y [1.4.9](#149-resolución-de-remotes-en-runtime)). El host registra el manifest del remote con `registerRemotes()`; mover un remote = cambiar la URL del manifest, sin rebuild del host. | ✅ hecha                 | Frontend + SRE   |
| 6   | Remote Cache de Turborepo: Vercel vs self-hosted                                                                                                                                                                                                                                                                                                                                                                                     | Cuando CI > 10 min       | Frontend + SRE   |
| 7   | Criterio de equivalencia visual sin Figma                                                                                                                                                                                                                                                                                                                                                                                            | Antes de Reconocimientos | Ambar + Frontend |

## Riesgos que deben tener dueño y fecha antes de la Fase 2

**R6** (URL horneada) · **R15** (JWT bloqueante) · **R16** (SRE en camino crítico) ·
**R17** (CORS y cache headers)

Detalle completo en el [registro de riesgos](riesgos.md).
