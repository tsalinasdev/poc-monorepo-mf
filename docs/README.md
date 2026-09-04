# Documentación — Microfrontend PeopleFirst (POC `pokedex-vuejs`)

Cuatro documentos y cuatro ADRs, cada uno con un trabajo distinto. Si solo vas a leer uno, depende de qué
necesites:

| Necesito…                                           | Leer                                                                                                                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Defender la decisión de monorepo ante alguien       | [monorepo-vs-multirepo.md](monorepo-vs-multirepo.md)                                                                                                               |
| Saber qué hacemos, en qué orden y quién             | [plan-implementacion-peoplefirst.md](plan-implementacion-peoplefirst.md)                                                                                           |
| Saber qué puede salir mal y qué hacemos al respecto | [riesgos.md](riesgos.md)                                                                                                                                           |
| Entender **por qué** el código está así             | [adr/0001](adr/0001-module-federation-en-monorepo.md), [adr/0002](adr/0002-turborepo.md), [adr/0003](adr/0003-pnpm.md) y [adr/0004](adr/0004-syncpack-renovate.md) |
| Correr el proyecto                                  | [README de la raíz](../README.md)                                                                                                                                  |

---

## Los documentos

### [Por qué monorepo](monorepo-vs-multirepo.md)

La decisión monorepo vs multi-repo, con la comparación contra `frontend-host`, el ejemplo
concreto de un cambio compartido propagado (6 PRs vs 1), y las objeciones respondidas:
"¿no es volver al monolito?", "¿y si crecemos?", "¿el CI no va a compilar todo?", "¿por qué
no Nx?". Versión escrita de la presentación al equipo.

### [Plan de implementación](plan-implementacion-peoplefirst.md)

Fases 0 a 4 con entregables, criterios de salida y dueños. Incluye qué resolvió ya la POC y
no hay que rehacer, los 7 requerimientos cerrados para la reunión con SRE, el patrón
estrangulador, el orden de migración (Reconocimientos → Clima → tenant) y las 7 decisiones
abiertas con fecha de cierre.

### [Registro de riesgos](riesgos.md)

R1 a R22, cada uno con nivel, estado, **señal de alerta**, mitigación concreta y dueño. Los
cinco de la presentación, más los que salieron de leer el código de la POC, más los de
ejecución en PeopleFirst. Un riesgo sin señal de alerta es una sorpresa programada.

### ADRs — decisiones de arquitectura

| ADR                                               | Decisión                                  | Estado   |
| ------------------------------------------------- | ----------------------------------------- | -------- |
| [0001](adr/0001-module-federation-en-monorepo.md) | Module Federation dentro de un monorepo   | Aceptada |
| [0002](adr/0002-turborepo.md)                     | Turborepo como orquestador de tareas      | Aceptada |
| [0003](adr/0003-pnpm.md)                          | pnpm 10 en vez de npm workspaces          | Aceptada |
| [0004](adr/0004-syncpack-renovate.md)             | Syncpack y Renovate para las dependencias | Aceptada |

El ADR 0001 tiene las **cinco reglas** que hacen que el monorepo no degenere en monolito, y
—esto es lo que más se olvida— los **umbrales explícitos** para revisar la decisión. Un ADR
sin criterio de salida es una opinión.

El ADR 0003 documenta algo incómodo: una hipótesis mía sobre pnpm que **la medición
desmintió**, y el hallazgo distinto que apareció al medir — el grafo de chunks federados
cambia según el gestor de paquetes. Queda escrito el error, no solo la conclusión.

---

## Lo más importante de todo esto, en tres puntos

1. **El único job que prueba la composición real es el E2E contra builds**
   (`test:e2e:preview`). Un dev server no minifica ni chunkea, así que el contrato `shared`
   nunca se negocia. Y hay una capa más: el grafo de chunks federados **cambia según el gestor
   de paquetes** (medido en el [ADR 0003](adr/0003-pnpm.md)), así que el artefacto verificado
   tiene que salir del mismo install que el que se despliega. No es opcional.
   → [R8](riesgos.md#r8--el-dev-server-no-ejercita-el-contrato-shared-🔴-mitigado)

2. **`packages/` es solo metadata de build-time.** Un paquete de runtime compartido se
   bundlea en cada remote y su versión de workspace `0.0.0` vuelve sin sentido la negociación
   de `requiredVersion` de MF. La duplicación de `src/base/` entre apps es deliberada.
   → [R5](riesgos.md#r5--shared-degenera-en-mini-monolito-interno-🔴-mitigado)

3. **La URL de cada remote está horneada en el build del host.** Es el acoplamiento de
   despliegue que MF debería eliminar, y hoy no lo hace. Resolverlo con un remote es chico;
   con seis en producción es una migración coordinada.
   → [R6](riesgos.md#r6--url-de-los-remotes-horneada-en-el-build-del-host-🔴-abierto)

## Fuentes externas

- [Module Federation — Vite](https://module-federation.io/integrations/build-tool/vite.html)
- [Module Federation — Monorepos](https://module-federation.io/integrations/framework/monorepos.html)
- [Benefits of Module Federation in a Monorepo](https://module-federation.io/practice/monorepos/)
- [Turborepo — Configuring tasks](https://turborepo.com/docs/crafting-your-repository/configuring-tasks)
- [Nx — Module Federation](https://nx.dev/docs/technologies/module-federation)

## Fuentes internas

- [MicroFront People First — planificación](https://docs.google.com/document/d/1-gqrCs_vTK0F2oSOariQ4xnz-QFy7ZbwO0IPFCzI3iE/edit)
- [Monorepo + Module Federation — presentación al equipo](https://docs.google.com/presentation/d/1-ngwpFZvUkbxPQ2bheAayYc3NJ0ASprUkDSENluaZO8/edit)
