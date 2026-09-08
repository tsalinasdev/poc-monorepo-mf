# Graph Report - pokedex-vuejs (2026-09-08)

## Corpus Check

- Corpus is ~45,049 words - fits in a single context window. You may not need a graph.

## Summary

- 896 nodes · 1091 edges · 73 communities (46 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)

- Character Domain (DragonBall)
- Pokemon Domain
- Root Dependencies
- Turborepo Config
- DragonBall Dependencies
- Pokemon Dependencies
- Host Dependencies
- Host Config & Bootstrap
- Host DevDependencies
- DragonBall DevDependencies
- Pokemon DevDependencies
- Shared Package Config
- Module Federation Config
- Hexagonal Architecture (DragonBall)
- Hexagonal Architecture (Pokemon)
- DragonBall App Bootstrap
- Pokemon App Bootstrap
- HTTP Client (DragonBall)
- HTTP Client (Pokemon)
- Renovate Config
- Smoke Tests
- Character Use Cases
- Host Scripts
- Host Runtime Dependencies
- DragonBall Runtime Dependencies
- TypeScript Config (Root)
- TypeScript Config (Host)
- TypeScript Config (DragonBall)
- DragonBall Scripts
- TypeScript Config (Pokemon)
- TypeScript Config (Shared)
- Pokemon Scripts
- TypeScript Config (Remote)
- TypeScript Config (Apps)
- E2E Tests
- Host Package Exports
- Pokemon Use Cases
- ESLint Config (Root)
- Navigation ViewModel
- ESLint Config (Host)
- ESLint Config (DragonBall)
- Community 41
- DragonBall API Config
- Pokemon API Config
- Prettier Config
- Remote Exports (Bridge)
- Community 46
- Repository Pattern
- Community 49
- Community 50
- Community 51
- Community 52
- Community 54
- Community 55
- Community 56
- Community 58
- Community 59
- Community 61
- Community 62

## God Nodes (most connected - your core abstractions)

1. `scripts` - 23 edges
2. `CharacterSummary` - 12 edges
3. `Character` - 12 edges
4. `PokemonSummary` - 12 edges
5. `Pokemon` - 12 edges
6. `tasks` - 12 edges
7. `scripts` - 11 edges
8. `FindCharacterProps` - 10 edges
9. `FindCharactersProps` - 10 edges
10. `FindPokemonProps` - 10 edges

## Surprising Connections (you probably didn't know these)

- `HttpCharacterRepository` --implements--> `CharacterRepository` [EXTRACTED]
  apps/remote-dragonball/src/modules/character/infrastructure/repositories/http-character.repository.ts → apps/remote-dragonball/src/modules/character/domain/ports/character.repository.ts
- `useCharacterDetailViewModel()` --calls--> `FindCharacterProps` [EXTRACTED]
  apps/remote-dragonball/src/modules/character/presentation/screens/character-detail/useCharacterDetailViewModel.ts → apps/remote-dragonball/src/modules/character/domain/props/find-character.props.ts
- `useCharacterListViewModel()` --calls--> `FindCharactersProps` [EXTRACTED]
  apps/remote-dragonball/src/modules/character/presentation/screens/character-list/useCharacterListViewModel.ts → apps/remote-dragonball/src/modules/character/domain/props/find-characters.props.ts
- `HttpPokemonRepository` --implements--> `PokemonRepository` [EXTRACTED]
  apps/remote-pokemon/src/modules/pokemon/infrastructure/repositories/http-pokemon.repository.ts → apps/remote-pokemon/src/modules/pokemon/domain/ports/pokemon.repository.ts
- `usePokemonDetailViewModel()` --calls--> `FindPokemonProps` [EXTRACTED]
  apps/remote-pokemon/src/modules/pokemon/presentation/screens/pokemon-detail/usePokemonDetailViewModel.ts → apps/remote-pokemon/src/modules/pokemon/domain/props/find-pokemon.props.ts

## Import Cycles

- None detected.

## Communities (73 total, 13 thin omitted)

### Community 0 - "Character Domain (DragonBall)"

Cohesion: 0.06
Nodes (32): CharacterFinder, CharactersFinder, Character, CharacterSummary, CharacterNotFoundException, CharacterRepository, FindCharacterProps, FindCharactersProps (+24 more)

### Community 1 - "Pokemon Domain"

Cohesion: 0.06
Nodes (29): PokemonFinder, PokemonsFinder, Pokemon, PokemonSummary, PokemonNotFoundException, PokemonRepository, FindPokemonProps, FindPokemonsProps (+21 more)

### Community 2 - "Root Dependencies"

Cohesion: 0.04
Nodes (46): vue-router, devDependencies, husky, lint-staged, prettier, syncpack, turbo, engines (+38 more)

### Community 3 - "Turborepo Config"

Cohesion: 0.05
Nodes (38): dependsOn, env, inputs, outputs, cache, persistent, cache, globalDependencies (+30 more)

### Community 4 - "DragonBall Dependencies"

Cohesion: 0.05
Nodes (37): awilix, axios, eslint, eslint-config-prettier, eslint-import-resolver-typescript, eslint-plugin-boundaries, eslint-plugin-oxlint, eslint-plugin-vue (+29 more)

### Community 5 - "Pokemon Dependencies"

Cohesion: 0.05
Nodes (37): awilix, axios, eslint, eslint-config-prettier, eslint-import-resolver-typescript, eslint-plugin-boundaries, eslint-plugin-oxlint, eslint-plugin-vue (+29 more)

### Community 6 - "Host Dependencies"

Cohesion: 0.06
Nodes (34): eslint, eslint-config-prettier, eslint-import-resolver-typescript, eslint-plugin-boundaries, eslint-plugin-oxlint, eslint-plugin-vue, jiti, jsdom (+26 more)

### Community 7 - "Host Config & Bootstrap"

Cohesion: 0.08
Nodes (14): coladaOptions, env, result, Env, envSchema, ADR-0005, registerRemoteRoutes(), RemoteRegistration (+6 more)

### Community 8 - "Host DevDependencies"

Cohesion: 0.08
Nodes (25): devDependencies, eslint, eslint-config-prettier, eslint-import-resolver-typescript, eslint-plugin-boundaries, eslint-plugin-oxlint, eslint-plugin-vue, jiti (+17 more)

### Community 9 - "DragonBall DevDependencies"

Cohesion: 0.08
Nodes (25): devDependencies, eslint, eslint-config-prettier, eslint-import-resolver-typescript, eslint-plugin-boundaries, eslint-plugin-oxlint, eslint-plugin-vue, jiti (+17 more)

### Community 10 - "Pokemon DevDependencies"

Cohesion: 0.08
Nodes (25): devDependencies, eslint, eslint-config-prettier, eslint-import-resolver-typescript, eslint-plugin-boundaries, eslint-plugin-oxlint, eslint-plugin-vue, jiti (+17 more)

### Community 11 - "Shared Package Config"

Cohesion: 0.09
Nodes (21): devDependencies, semver, @tsconfig/node24, @types/node, @types/semver, typescript, vitest, exports (+13 more)

### Community 12 - "Module Federation Config"

Cohesion: 0.12
Nodes (12): createHostFederationConfig(), RemoteManifestUrls, ADR-0005, DEV_ENTRIES, ADR-0005, ADR-0005, ADR-0005, SharedDependencies (+4 more)

### Community 13 - "Hexagonal Architecture (DragonBall)"

Cohesion: 0.14
Nodes (7): Input, UseCase, Command, DomainException, Props, Query, Result

### Community 14 - "Hexagonal Architecture (Pokemon)"

Cohesion: 0.14
Nodes (7): Input, UseCase, Command, DomainException, Props, Query, Result

### Community 15 - "DragonBall App Bootstrap"

Cohesion: 0.13
Nodes (11): coladaOptions, env, result, Env, envSchema, ADR-0005, router, ADR-0005 (+3 more)

### Community 16 - "Pokemon App Bootstrap"

Cohesion: 0.13
Nodes (11): coladaOptions, env, result, Env, envSchema, ADR-0005, router, ADR-0005 (+3 more)

### Community 17 - "HTTP Client (DragonBall)"

Cohesion: 0.23
Nodes (4): AxiosHttpClient, HttpServiceException, HttpHeaders, HttpResponse

### Community 18 - "HTTP Client (Pokemon)"

Cohesion: 0.23
Nodes (4): AxiosHttpClient, HttpServiceException, HttpHeaders, HttpResponse

### Community 19 - "Renovate Config"

Cohesion: 0.12
Nodes (15): config:recommended, :semanticCommitTypeAll(chore), extends, labels, lockFileMaintenance, enabled, schedule, packageRules (+7 more)

### Community 20 - "Smoke Tests"

Cohesion: 0.19
Nodes (11): check(), EXPECTED_SINGLETONS, failures, fetchOk(), MIME, notes, REMOTES, ROOT (+3 more)

### Community 21 - "Character Use Cases"

Cohesion: 0.21
Nodes (7): withSetup(), characterRepository, findAll, findById, useCase, buildCharacterSummary(), execute

### Community 22 - "Host Scripts"

Cohesion: 0.18
Nodes (11): scripts, build, dev, format, lint, lint:fix, preview, test (+3 more)

### Community 23 - "Host Runtime Dependencies"

Cohesion: 0.20
Nodes (10): dependencies, awilix, axios, @module-federation/bridge-vue3, pinia, @pinia/colada, vue, vue-router (+2 more)

### Community 24 - "DragonBall Runtime Dependencies"

Cohesion: 0.20
Nodes (10): dependencies, awilix, axios, @module-federation/bridge-vue3, pinia, @pinia/colada, vue, vue-router (+2 more)

### Community 25 - "TypeScript Config (Root)"

Cohesion: 0.20
Nodes (9): compilerOptions, module, moduleResolution, noEmit, tsBuildInfoFile, types, extends, include (+1 more)

### Community 26 - "TypeScript Config (Host)"

Cohesion: 0.22
Nodes (8): compilerOptions, noUncheckedIndexedAccess, paths, tsBuildInfoFile, exclude, extends, include, @vue/tsconfig/tsconfig.dom.json

### Community 27 - "TypeScript Config (DragonBall)"

Cohesion: 0.22
Nodes (8): compilerOptions, composite, tsBuildInfoFile, types, exclude, extends, include, ./tsconfig.app.json

### Community 28 - "DragonBall Scripts"

Cohesion: 0.22
Nodes (9): scripts, build, dev, format, lint, lint:fix, preview, test (+1 more)

### Community 29 - "TypeScript Config (Pokemon)"

Cohesion: 0.22
Nodes (8): compilerOptions, noUncheckedIndexedAccess, paths, tsBuildInfoFile, exclude, extends, include, @vue/tsconfig/tsconfig.dom.json

### Community 30 - "TypeScript Config (Shared)"

Cohesion: 0.22
Nodes (8): compilerOptions, composite, tsBuildInfoFile, types, exclude, extends, include, ./tsconfig.app.json

### Community 31 - "Pokemon Scripts"

Cohesion: 0.22
Nodes (9): scripts, build, dev, format, lint, lint:fix, preview, test (+1 more)

### Community 32 - "TypeScript Config (Remote)"

Cohesion: 0.22
Nodes (8): compilerOptions, noUncheckedIndexedAccess, paths, tsBuildInfoFile, exclude, extends, include, @vue/tsconfig/tsconfig.dom.json

### Community 33 - "TypeScript Config (Apps)"

Cohesion: 0.22
Nodes (8): compilerOptions, composite, tsBuildInfoFile, types, exclude, extends, include, ./tsconfig.app.json

### Community 34 - "E2E Tests"

Cohesion: 0.29
Nodes (4): expectSelected(), navLink(), repoRoot, @playwright/test

### Community 35 - "Host Package Exports"

Cohesion: 0.25
Nodes (8): dependencies, @module-federation/bridge-vue3, @module-federation/runtime, pinia, @pinia/colada, vue, vue-router, zod

### Community 36 - "Pokemon Use Cases"

Cohesion: 0.36
Nodes (3): withSetup(), buildPokemonSummary(), execute

### Community 37 - "ESLint Config (Root)"

Cohesion: 0.29
Nodes (6): categories, correctness, env, browser, plugins, $schema

### Community 38 - "Navigation ViewModel"

Cohesion: 0.38
Nodes (3): { navItems }, usePublicLayoutViewModel(), NavItemModel

### Community 39 - "ESLint Config (Host)"

Cohesion: 0.29
Nodes (6): categories, correctness, env, browser, plugins, $schema

### Community 40 - "ESLint Config (DragonBall)"

Cohesion: 0.29
Nodes (6): categories, correctness, env, browser, plugins, $schema

### Community 42 - "DragonBall API Config"

Cohesion: 0.40
Nodes (4): API_BASE_URL, DEFAULT_PAGE_SIZE, HTTP_RETRY_ATTEMPTS, HTTP_TIMEOUT_MS

### Community 43 - "Pokemon API Config"

Cohesion: 0.40
Nodes (4): API_BASE_URL, DEFAULT_PAGE_SIZE, HTTP_RETRY_ATTEMPTS, HTTP_TIMEOUT_MS

### Community 44 - "Prettier Config"

Cohesion: 0.40
Nodes (4): printWidth, $schema, semi, singleQuote

### Community 45 - "Remote Exports (Bridge)"

Cohesion: 0.50
Nodes (3): remoteDragonball/export-app, remotePokemon/export-app, ADR-0005

### Community 47 - "Repository Pattern"

Cohesion: 0.50
Nodes (3): get, httpClient, repository

## Knowledge Gaps

- **491 isolated node(s):** `$schema`, `semi`, `singleQuote`, `printWidth`, `$schema` (+486 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 563 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Host DevDependencies` to `Host Dependencies`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `DragonBall DevDependencies` to `DragonBall Dependencies`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Pokemon DevDependencies` to `Pokemon Dependencies`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `$schema`, `semi`, `singleQuote` to the rest of the system?**
  _491 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Character Domain (DragonBall)` be split into smaller, more focused modules?**
  _Cohesion score 0.05621621621621622 - nodes in this community are weakly interconnected._
- **Should `Pokemon Domain` be split into smaller, more focused modules?**
  _Cohesion score 0.06116700201207243 - nodes in this community are weakly interconnected._
- **Should `Root Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
