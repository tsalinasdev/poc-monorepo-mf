---
name: create-module
description: Scaffold a new feature module using the repository's screaming architecture, Pinia patterns, and verification rules.
---

# Create Module Skill

Use this skill when a user asks to scaffold a new feature module.

## Inputs

- module name in kebab-case
- primary entity name in PascalCase
- REST, GraphQL, or both
- initial views needed

## Rules

- Use the standard `src/modules/<feature>/` structure.
- Prefer small, typed files over large generators.
- Use setup-style Pinia stores.
- Keep services and composables within LEGO limits.
- Use Talanify components in views and forms.
- Lazy-load route views.

## Workflow

1. Inspect sibling feature modules and copy established structure.
2. Create only the directories and files needed for the requested scope.
3. Verify any Talanify component APIs from installed source or official docs before using them in views.
4. Add models, store, services or queries, composables, router, and views as needed.
5. Wire names, constants, and imports to repository conventions.
6. Run the minimum relevant verification commands for the created files.
