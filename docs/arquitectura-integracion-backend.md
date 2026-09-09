# Arquitectura del monorepo front e integración con el backend

> Documento canónico para responder las preguntas recurrentes del equipo sobre
> la estructura del monorepo y cómo se conecta con el monolito PHP actual.
> Última revisión: cierre de la POC (septiembre 2026).

## TL;DR

- **Estructura del repo**: `root > apps/<remote>/src/modules/<feature>/` con
  screaming architecture por dominio. Confirmado por la POC en
  `pokedex-vuejs`.
- **Integración con el backend**: el front **no llama directo al monolito PHP**.
  Entre el monorepo y el monolito va un **BFF (Backend for Frontend)** que
  expone JSON y orquesta la migración pantalla por pantalla.
- **Prerrequisito bloqueante**: **JWT primero** (Fase 1.1 del plan). Sin JWT
  no se puede leer sesión ni autorizar requests, así que el BFF no puede
  construirse y los remotes no pueden hablar con nada.

El plan completo (con dependencias, riesgos y fechas) está en
[`plan-implementacion-peoplefirst.md`](./plan-implementacion-peoplefirst.md).
Este documento es un resumen ejecutivo para preguntas del equipo.

---

## 1. Estructura del monorepo

### Vista de carpetas

```
pokedex-vue/
├── apps/
│   ├── host/                  ← shell: chrome compartido + router del host
│   ├── remote-kpi/            ← 1er remote: gestión de KPI
│   │   └── src/modules/
│   │       └── configuracion/ ← screaming architecture del feature
│   │           ├── components/   (asignacion/, ciclos/, kpis/, resultados/, shared/)
│   │           ├── composables/  (useCiclos, useKpis, useAsignaciones, …)
│   │           ├── services/     (ciclosService, kpisService, …)
│   │           ├── views/        (CiclosView, KpisView, …)
│   │           ├── utils/        (indexedPayload, mediciones, …)
│   │           ├── router.ts
│   │           └── tabs.ts
│   ├── remote-dragonball/     ← 2do remote (API externa, sin módulos propios)
│   └── …                      ← futuros remotes (dashboard, clima, …)
├── packages/
│   └── mf-shared/             ← contrato `shared` de Module Federation
└── docs/                      ← plan, riesgos, ADRs (este documento vive acá)
```

### Reglas del screaming architecture

Cada remote tiene su propio `src/modules/<feature>/`. Las convenciones:

- **Carpetas por dominio** (`configuracion`, `dashboard`, `reconocimientos`, …),
  no por tipo técnico (`components/`, `services/`, …). Las carpetas técnicas
  viven **dentro** de cada feature, no al lado.
- **Subcarpetas dentro de un feature**:
  - `components/` — SFC del dominio (tablas, drawers, cards).
  - `composables/` — hooks Vue 3 con `useX()` (estado + lógica de UI).
  - `services/` — capa que llama a la API (BFF). **No se llama al monolito
    directo**: el service habla JSON contra un endpoint del BFF.
  - `views/` — páginas lazy-loaded. Una por ruta del feature.
  - `utils/` — funciones puras sin estado (parsers, formatters).
  - `router.ts` — rutas relativas al feature (la ruta del shell las monta
    bajo `basePath`).
- **Transversal** (compartido entre features): vive en
  `src/components/ui/` y `src/composables/` del remote, **no** en modules.

### El shell **no** tiene `modules/`

`apps/host` solo contiene:

- Chrome compartido (`AppHeader`, `MainNavbar`, `ShellBreadcrumbs`).
- Router del host + catálogo de remotes (`router/remotes.ts`).
- Plugins (Pinia, PiniaColada, etc.).

Si en algún momento el shell empieza a tener `modules/`, **algo está mal
ubicado** y hay que moverlo al remote que corresponda. La regla: el shell
es layout, no dominio.

### Catálogo de remotes

El catálogo vive en `apps/host/src/router/remotes.ts`. Cada entrada es:

```ts
{
  id: 'remoteKpi',                          // match con module-federation.config.ts
  routeName: 'remote-kpi',                  // name del catch-all route
  navLabel: 'Gestión KPI',                  // label en el navbar
  basePath: '/gestion-kpi',                 // sección en la URL
  loadApp: () => loadBridgeApp(loadKpiBridge),
}
```

Agregar un remote nuevo hoy: crear `apps/<nombre>/` siguiendo
`apps/remote-kpi` como plantilla + agregar la entrada al catálogo. El shell
**no se toca** más allá de eso.

---

## 2. Integración con el backend

### 2.1 El monolito PHP no se llama directo

El monolito actual (`monolith-do-core`) entrega HTML renderizado por
`blade.php`. Los remotes Vue federados consumen **JSON**. Si el front llamara
directo al monolito, tendría que parsear HTML y manejar cookies de sesión
PHP, lo cual no escala y bloquea la migración pantalla por pantalla.

Entre el front y el monolito va un **BFF (Backend for Frontend)**:

```
[ Vue remote ] --HTTP + JWT--> [ BFF ] --consulta interna--> [ monolito PHP ]
                                       |
                                       +--> reescribe respuesta a JSON
                                       +--> valida JWT y permisos
                                       +--> cache selectivo
                                       +--> traduce shape (1:1) a shape
                                            optimizado para el front
```

### 2.2 Por qué el BFF no es solo un proxy

- **Contratos rediseñados**: el monolito expone HTML; el BFF expone JSON
  paginado, filtrado, con la forma que cada feature necesita. No replicar
  1:1 la lógica del PHP.
- **Aislamiento**: si un endpoint nuevo hace un join entre dos tablas que
  en el monolito están acopladas, el BFF lo resuelve sin tocar el PHP.
- **Migración gradual**: el BFF enruta a un servicio nuevo o al monolito
  según feature flag. El front no se entera.
- **Desactivación segura del monolito**: el patrón strangler (Fase 4 del
  plan) reemplaza una pantalla del PHP a la vez. Cuando el flag de un módulo
  está al 100% sin incidencias por un ciclo de release, se apaga la blade
  correspondiente. **No** se borra la blade hasta entonces.

### 2.3 JWT: prerrequisito bloqueante

Sin JWT, **nada** del BFF se puede construir. Razones:

1. El host no puede leer sesión ni usuario actual.
2. Los remotes no pueden llamar endpoints autenticados.
3. El BFF no puede validar permisos por request.
4. El catálogo de features (qué módulo ve cada rol) no se puede poblar.

La Fase 1.1 del plan (JWT) es bloqueante para Fase 2 (HOST) y siguientes.
El detalle operativo (rotación, refresh, sesión, claims) está en el plan.

---

## 3. Orden de los pasos

Referencia: Fase 1 del plan.

| #   | Paso                                              | Bloqueante para    | Estado        |
| --- | ------------------------------------------------- | ------------------ | ------------- |
| 1   | **JWT implementado y validado en DEP** (Fase 1.1) | BFF, host, remotes | Pendiente     |
| 2   | SRE / infra: bucket + CDN + CORS (Fase 1.2)       | Deploy             | Pendiente     |
| 3   | Entorno local: pnpm + Vite + HTTPS (Fase 1.3)     | Devs               | Cerrado (POC) |
| 4   | BFF: skeleton + primer endpoint real (Fase 2)     | Remotes            | Pendiente     |
| 5   | Plantilla de remote + primer remote real (Fase 3) | Migración          | Cerrado (POC) |
| 6   | Migración pantalla por pantalla (Fase 4)          | —                  | Pendiente     |

**Reglas operativas** (de Fase 4.4 del plan):

- No se borra una blade del monolito hasta que su feature flag lleve un
  ciclo de release completo al 100% sin incidencias. El flag es la red
  de seguridad; borrar la legacy es sacarla.
- El feature flag se evalúa en **runtime**, no en build-time. Un flag
  compilado no sirve para revertir sin deploy.

---

## 4. Referencias

- [`plan-implementacion-peoplefirst.md`](./plan-implementacion-peoplefirst.md) —
  plan completo, dependencias entre fases, riesgos R1–R22.
- [`monorepo-vs-multirepo.md`](./monorepo-vs-multirepo.md) — decisión de
  arquitectura: por qué monorepo.
- [`riesgos.md`](./riesgos.md) — riesgos vivos (R6, R15, R16, R17 son los
  que tienen que tener dueño y fecha antes de Fase 2).
- ADRs en `docs/adr/`, en particular:
  - `0001-module-federation-en-monorepo.md` — reglas del MF en el monorepo.
  - `0005-bridge-y-manifest-como-contrato.md` — el contrato `./export-app`
    de cada remote.
- POC de referencia: `pokedex-vuejs` con dos remotes (KPI + Dragon Ball)
  y el shell consumiendo ambos. Pipeline verde, incluyendo
  `test:e2e:preview` (12 tests contra builds, no contra dev servers).
