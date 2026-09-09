---
name: create-component
description: Create a Vue 3 component that uses Talanify Next, follows the repository architecture, and keeps business logic in composables.
---

# Create Component Skill

Use this skill when a user asks to create or scaffold a component.

## Inputs

- component name in PascalCase with at least two words
- target module
- purpose of the component
- expected props, events, and loading states

## Rules

- Use `<script lang="ts" setup>` and Composition API only.
- Use `@talana/talanify-next` components for UI.
- Use the `communications:` Tailwind prefix.
- Keep the component below 300 lines.
- Extract non-trivial business logic to a composable.
- Add accessibility support with `useId()` and semantic interactions.
- Add behavior-oriented tests when component behavior changes.

## Workflow

1. Inspect nearby module files and existing component patterns.
2. Decide whether the component belongs in `shared` or a feature module.
3. Verify the required Talanify component props and slots from installed source or official docs before writing code.
4. Create the component with typed props and emits.
5. Reuse existing composables, models, and constants before inventing new ones.
6. Run the minimum relevant verification commands for the touched files.
