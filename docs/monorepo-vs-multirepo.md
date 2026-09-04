# Por qué monorepo para el microfrontend de PeopleFirst

Documento de decisión. Versión escrita de la presentación al equipo, con los datos de la POC
y las objeciones respondidas.

**La tesis en una línea:** multi-repo resuelve **fronteras entre equipos**; monorepo resuelve
**mantenibilidad para un equipo chico**. PeopleFirst tiene el segundo problema, no el primero.

---

## 1. El problema no es Module Federation. Es dónde vive el código.

`frontend-host` (Talana) ya usa Module Federation, y funciona. Lo que se está decidiendo acá
no es "MF sí o no" —eso está resuelto— sino **multi-repo o monorepo**. Son dos ejes
independientes:

|            | Un repo                        | Muchos repos                  |
| ---------- | ------------------------------ | ----------------------------- |
| **Con MF** | ← PeopleFirst (esta propuesta) | ← `frontend-host` hoy         |
| **Sin MF** | Monolito frontend              | Apps sueltas, sin composición |

En los dos casos con MF: **cada app se construye y se despliega sola**. Eso no cambia.

## 2. Lo que le cuesta a `frontend-host` el multi-repo

No es teoría: son los tres síntomas que el equipo ya está viviendo.

| Síntoma                         | Mecánica                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Código compartido duplicado** | La lógica común entre remotes vive copiada, o como paquete npm publicado por separado                   |
| **Refactor = publicar versión** | Cambiar algo compartido obliga a subir versión del paquete y actualizarla en cada consumidor            |
| **Desincronización**            | Cada repo puede quedar en una versión distinta del paquete compartido, con comportamiento inconsistente |

Ese costo **compra algo**: fronteras duras entre equipos que avanzan en paralelo, con
permisos, calendarios de release y CI independientes. Con muchos equipos, vale la pena.

## 3. PeopleFirst no tiene ese problema organizacional

|                   | `frontend-host` (Talana)           | PeopleFirst (nuevo MF)                  |
| ----------------- | ---------------------------------- | --------------------------------------- |
| Equipos           | Muchos equipos en paralelo         | **2 desarrolladores, un solo equipo**   |
| Repositorios      | Multi-repo (1 por remote/host)     | Monorepo (host + remotes + shared)      |
| Código compartido | Paquete npm publicado y versionado | Workspace local, mismo PR               |
| Build y deploy    | Independiente por repo             | **Independiente por app (se mantiene)** |

Con 2 personas, el peaje de publicar y versionar un paquete compartido no compra ninguna
frontera: la frontera que protege es entre nosotros dos.

## 4. La diferencia concreta: un cambio compartido

**El escenario:** hay que agregar `@vueuse/core` al contrato de singletons de MF, porque dos
remotes lo usan y dos copias rompen la reactividad.

### En multi-repo

```
1. PR en repo mf-shared             → cambiar el contrato
2. Publicar @talana/mf-shared@1.4.0 → esperar el pipeline de npm
3. PR en repo host                  → bump a 1.4.0, verificar
4. PR en repo remote-kpi            → bump a 1.4.0, verificar
5. PR en repo remote-clima          → bump a 1.4.0, verificar
6. PR en repo remote-reconocimientos→ bump a 1.4.0, verificar
```

Seis PRs en cinco repos, y **entre el paso 2 y el 6 el sistema está en un estado inconsistente**:
hay remotes en 1.3.0 y remotes en 1.4.0 conviviendo en la misma página. Si alguien se olvida
del paso 6, nadie se entera hasta que un usuario reporta algo raro.

### En monorepo

```
1. Un PR: packages/mf-shared/src/index.ts + los package.json de las apps que lo necesiten
   → turbo run lint type-check test corre sobre todo el workspace
   → el guard de contrato verifica que ninguna app declare una versión fuera del rango
   → el E2E contra builds verifica que en la página real haya UNA sola instancia
```

Un PR. Estado inconsistente: imposible, porque no existe un momento intermedio. Y el
**guard automatizado** (`packages/mf-shared/tests/shared-contract.spec.ts`) hace fallar el CI
si el rango declarado deja de ser superconjunto de lo que las apps instalan — el paso 6
olvidado no puede pasar.

## 5. Los cinco beneficios, con su mecánica

| Beneficio                    | Qué lo produce                                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Refactor atómico**         | Un PR cambia el paquete compartido y todos sus consumidores. Sin publicar, sin versionar, sin ventana de inconsistencia.            |
| **Visibilidad de impacto**   | `turbo run lint type-check test` corre sobre todo el workspace. Si algo se rompe, se ve **antes** del merge, no en el repo de otro. |
| **Menos overhead de config** | Un Prettier, un husky, un `lint-staged`, un CI. Con multi-repo son N copias que se desincronizan sin que nada falle.                |
| **Sigue siendo MF real**     | Cada app conserva su `dist/` y su deploy independiente. El monorepo es conveniencia de **desarrollo**, no de despliegue.            |
| **Onboarding simple**        | Un clone, un install, `pnpm dev` y el sistema completo corriendo en local (host + remotes en paralelo).                             |

## 6. Objeciones

### "¿No es volver al monolito que estamos tratando de romper?"

No, y la distinción es verificable, no retórica. El monolito acopla **runtime**: todo se
despliega junto y un error en una parte tumba el resto. Acá:

- Cada app tiene su propio `dist/`, su propio deploy y su propia URL de bucket.
- Publicar Dragon Ball no obliga a tocar Pokémon.
- Un remote caído degrada **solo su sección** (probado en `e2e/remote-outage.spec.ts`, que
  aborta el tráfico al origen de un remote).
- No hay imports entre apps. Cada una es su propio hexágono y `eslint-plugin-boundaries` lo
  hace cumplir; el `exposes` de MF es su única API pública, como un REST lo es para un
  microservicio.

Lo que se comparte es el **repositorio**, no el runtime ni el pipeline.

### "¿Y si mañana somos cinco equipos?"

Se revisa la decisión — y los umbrales para revisarla están **escritos** en el
[ADR 0001](adr/0001-module-federation-en-monorepo.md#condiciones-bajo-las-que-hay-que-revisar-esta-decisión),
no en la memoria de nadie: ≥ 3 equipos con releases independientes, un remote que necesite
otra versión mayor de Vue, CI en frío > 15 min con Remote Cache, un requisito de permisos por
dominio, o > 12 apps.

Y el corte es barato **si se mantienen las reglas del ADR**: cada app ya tiene su
`package.json`, su config, sus tests y cero imports cruzados. `git subtree split` conserva la
historia; lo único a resolver es publicar `@pokedex/mf-shared` como paquete npm. Cada import
cruzado que se cuele encarece ese corte — es el riesgo
[R4](riesgos.md#r4--migrar-a-multi-repo-después-cuesta-🟡-vigilado).

### "El CI va a compilar todo en cada push"

Era el riesgo real del monorepo, y está mitigado. Turborepo pone el grafo de tareas explícito
y cachea por hash de inputs. Medido en la POC:

```
frío:        11 tareas, 0 cacheadas → 31,6 s
sin cambios: 11 tareas, 8 cacheadas → 13,5 s
build:        7 tareas, 4 cacheadas →  2,6 s
```

Lo importante no es el número de hoy con 3 apps: es que **no crece** con la cantidad de
remotes, porque solo se recomputa lo que cambió. Detalle en el
[ADR 0002](adr/0002-turborepo.md).

### "¿No perdemos el despliegue independiente?"

Se mantiene, con **una salvedad honesta**: hoy la URL de cada remote está horneada en el build
del host (`VITE_REMOTE_*_ENTRY`), así que mover un remote de origen obliga a rebuildear el
host. Es el riesgo [R6](riesgos.md#r6--url-de-los-remotes-horneada-en-el-build-del-host-🔴-abierto)
y **no es un problema del monorepo** —pasa igual en multi-repo— sino de resolver las URLs en
build-time. La solución es resolverlas en runtime, y está en la Fase 2 del
[plan](plan-implementacion-peoplefirst.md).

### "¿Por qué no Nx, que tiene soporte de Module Federation?"

Lo tiene, pero **para Webpack/Rspack**. Esta POC federa con `@module-federation/vite`, así que
los generadores de MF de Nx no aplican: quedaría el costo conceptual de Nx sin su mayor
beneficio. Si PeopleFirst migra a Rsbuild/Rspack, la decisión se revisa. Comparación completa
en el [ADR 0002](adr/0002-turborepo.md#alternativas-consideradas).

## 7. Lo que hay que diseñar bien desde el inicio

Los beneficios son gratis; los riesgos no. Los cinco que se aceptan conscientemente:

| Riesgo                                         | Mitigación                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| Acoplamiento de versiones entre host y remotes | `requiredVersion` como **rango**, con guard automatizado que impide que mienta       |
| CI lento sin cache ni filtrado                 | Turborepo desde el día uno — **ya hecho**                                            |
| No escala igual al crecer el equipo            | Umbrales de revisión escritos y revisados por trimestre                              |
| Migrar después cuesta                          | Cero imports cruzados, verificado por linter. El corte se mantiene barato            |
| **`shared` sigue siendo diseño, no tooling**   | `packages/` solo lleva metadata de build-time. Criterio de cinco preguntas en review |

El último es el que más importa y el que ninguna herramienta resuelve: sin un criterio claro
de qué entra al paquete compartido, `packages/` se convierte en un mini-monolito interno. El
criterio está en el
[ADR 0001](adr/0001-module-federation-en-monorepo.md#3-la-duplicación-tiene-un-criterio-no-una-intuición)
y se aplica en cada PR.

Registro completo, con señales de alerta y dueños: [riesgos.md](riesgos.md).

## 8. Recomendación

**Monorepo con Module Federation y Turborepo**, con las cinco reglas del ADR 0001 aplicadas
en review, y con los umbrales de revisión revisados cada trimestre.

No porque el monorepo sea mejor en abstracto —no lo es— sino porque con **2 desarrolladores y
un solo equipo**, el costo que `frontend-host` paga por sus fronteras no compra ninguna
frontera que PeopleFirst necesite hoy.

---

**Siguiente:** [plan de implementación](plan-implementacion-peoplefirst.md)
