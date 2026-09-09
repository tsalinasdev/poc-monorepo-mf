---
name: no-skip-typescript
description: Convention for typing the whole monorepo in TypeScript. Use when adding/editing code, reviewing PRs, or fixing type errors. Triggers on "no skips TS", "no ts-nocheck", "tipar", "convención TS", "no any", "no as any".
---

# No Skip TypeScript — Convention

TypeScript is a contract. Skipping it is a way of punting the cost to whoever reads the code next. Every `@ts-nocheck`, every `any` y `as any` que aparece sin justificación degrada la calidad del monorepo y se va a tener que pagar más adelante.

This skill is the rule book. Apply it on every file you touch.

## Inputs

- The file under review (new or existing)
- The error or PR comment that triggered the check

## Rules (the house rules)

### 1. No `@ts-nocheck` / `@ts-ignore` sin justificación

- **Never** start a file with `// @ts-nocheck` "to make the build green".
- **Never** use `// @ts-ignore` on a line without a one-line comment saying why it cannot be typed today and when it will be removed.
- If a file is too complex to type in a single change, **split the typing work into a follow-up** — don't skip the file.

The only acceptable excuse: a third-party type we don't control that is wrong. Then open an issue, document the workaround, and write the type you want in a `// @ts-expect-error NAME_OF_ISSUE` block with a description.

### 2. `any` is a code smell; `as any` is a code smell on fire

- Avoid `any` in declarations. If a value is genuinely "I don't know yet", type it as `unknown` and narrow it where used.
- `as any` is never a fix. Use it only when converting from `unknown` to a more specific type that you then re-validate.
- `as` casts are allowed, but they must be followed by a comment explaining the constraint that makes the cast safe. If you can't write that comment, the cast is wrong.

### 3. `<script lang="ts" setup>` always

- Every Vue SFC uses `<script lang="ts" setup>` (or `<script setup lang="ts">` — both are valid; the talanify convention prefers `lang` first).
- No plain `<script setup>` without a language, even for components you think are "just markup".
- The only exception: a Vue file with no `<script>` block at all (purely a `<template>` placeholder) is fine.

### 4. Type the public surface of every file

- Every exported function, composable, store action, service method, route component: typed inputs, typed outputs, typed props, typed emits.
- `defineProps<{...}>()` with a generic, not `defineProps({...})` with runtime validators only — the latter becomes `unknown` everywhere it's used.
- `defineEmits<{...}>()` with the call signature, not `defineEmits(['event-name'])`.
- `ref<T>()`, `computed<T>()`, `useRoute<R extends RouteLocationNormalizedLoaded>()` — always.

### 5. `tsconfig.json` is part of the contract

- `strict: true` is the default. The monorepo does not relax it for a single app — the relaxation becomes a debt trap.
- `noUncheckedIndexedAccess: true` is the default in this monorepo. `arr[i]` returns `T | undefined` on purpose: index access can fail.
- `noImplicitAny: true` — the previous name for the "we don't have a value of `any`" guarantee.
- `verbatimModuleSyntax: true` — type-only imports use `import type` explicitly.

If a `tsconfig.json` relaxes any of these, there must be a `// TODO:` comment explaining what needs to be true for the relaxation to be removed and a target date.

### 6. Don't fight the compiler; teach the compiler

- A `// @ts-nocheck` to silence 20 errors is a confession: you didn't read the errors. Each one is teaching you something about the code.
- The right path is to read the first error, fix it, see the next one, fix it, repeat. `vue-tsc` and `tsc` are teammates, not enemies.
- If a vue-tsc error in a template reveals that a composable returns `unknown`, the fix is to type the composable — not to disable template checking.

## Workflow

When touching a file (or reviewing a PR that touches one):

1. Open the file and look for any of the bypass patterns:
   - `// @ts-nocheck` at the top
   - `// @ts-ignore` without a follow-up explanation
   - `any` in a type annotation (or `as any` in a cast)
   - `defineProps({...})` without a generic
   - `defineEmits([...])` without a generic
   - `<script setup>` (no `lang`)
2. If you find any, do not stop at the file that triggered the review: open the file's closest callers (composables, utils, services) and apply the same scan there. A `// @ts-nocheck` is a smell that propagates.
3. Fix the immediate problem by typing the value. If the type is genuinely unknown, mark the variable with `unknown` and narrow at the use site.
4. Run `pnpm --filter <app> type-check` to confirm the file passes cleanly. If the `vue-tsc` errors propagate from a composable with `unknown`, the next step is to type that composable, not to silence the view.
5. If you discover that the typing work for a ported module is too large for a single change, write a follow-up ticket and link it from the TODO comment, but do not ship a `// @ts-nocheck` to "unblock the merge".

## When you really cannot type it

Sometimes the right answer is to bring the type in from the model layer. Example: a service that consumes a `@api/...` mock should import its `Ciclo`, `Kpi`, etc. type from the api file and propagate it through the composable, instead of typing the composable as a `Ref<any[]>`. The `api/` directory is the source of truth for the domain types; use it.

When the type would be `Map<unknown, unknown>` because the contract is genuinely opaque, write a type with a TODO and the link to the upstream definition that doesn't exist yet:

```ts
// TODO: when api/configuracion/usuarios ships the real types, replace
// this with the upstream definition. Tracked in PDT3-XXXX.
export interface Usuario {
  id: number
  nombre: string
  // ... 12 more fields, all unknown until the contract lands
}
```

That's a real type. It compiles, it documents, and it has a deadline.

## Anti-patterns to call out in code review

| Anti-pattern                                    | Why it's wrong                                                             | What to ask for                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `// @ts-nocheck` at the top of a file           | Silences the compiler for the whole file, even lines that would type-check | Remove it and fix the errors                                                  |
| `// @ts-ignore` with no comment                 | Hides a real problem with no breadcrumbs                                   | Add a one-line comment + an issue link                                        |
| `defineProps({...})` with runtime types only    | Becomes `unknown` in the template                                          | Convert to `defineProps<{...}>()` with a generic                              |
| `let timer: any` or `let result: any`           | Disables inference for the rest of the function                            | Use `let timer: ReturnType<typeof setTimeout> \| null`                        |
| `as Foo` with no comment                        | The cast is hiding a real type mismatch                                    | Add a comment explaining the constraint, or fix the root type                 |
| `tsconfig` with `strict: false` in a single app | Inconsistency — the rule book says `strict: true` everywhere               | Add a TODO and a target date, then revert                                     |
| `ref(null)` for a primitive that can't be null  | The type says `T \| null` forever                                          | Use `ref<T>()` and set the value when known, or use a separate "isLoaded" ref |

## Verification

After touching a file, run the minimum:

```sh
pnpm --filter <app> type-check
pnpm --filter <app> lint
```

If both pass, you're done. If lint complains about a `// @ts-nocheck` you just added, you didn't follow rule 1.

When a `tsconfig.json` had a relaxation that you removed, also run the full pipeline to confirm the downstream effects are caught:

```sh
pnpm deps:check
pnpm lint
pnpm type-check
pnpm test
pnpm build
pnpm smoke:build
```
