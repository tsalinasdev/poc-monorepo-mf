---
name: talanify-next
description: >
  Talanify Next design system for Vue 3 — 87 components, design tokens,
  composables, and patterns. Use when building UI with @talana/talanify-next
  to get correct props, slots, tokens, variants, and accessibility.
metadata:
  version: '7.8.0'
---

# @talana/talanify-next — AI Skill Reference

A Vue 3 component library for Talana's internal products. Pure UI — no business logic, no routing, no API calls.

**Tech stack:** Vue 3.5+ | TypeScript 5.9 | Tailwind CSS v4 (`tln:` prefix) | tailwind-variants | Storybook 9

## Quick Start

### Instalación

```sh
pnpm add @talana/talanify-next
```

### Importar estilos y componentes

```typescript
import { TButton, TInput, TModal } from '@talana/talanify-next'
import '@talana/talanify-next/index.css'
```

### Cargar la fuente Inter

La librería **no carga la fuente automáticamente**. Debes importar Inter manualmente en tu archivo CSS principal (o incluirla con un `<link>` en el `index.html`):

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
```

## Critical Conventions (Always Apply)

| Rule              | Details                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------- |
| Tailwind prefix   | Every utility class uses `tln:` — e.g., `tln:flex`, `tln:bg-purple-500`                     |
| tv() config       | Always pass `{ twMerge: false }` as second argument to `tv()`                               |
| DOM IDs           | Use `useId()` from Vue — never `Math.random()`                                              |
| Template refs     | Use `useTemplateRef()` — never `ref<HTMLElement>()`                                         |
| v-model           | Use `defineModel<T>()` — never manual prop + emit                                           |
| Attrs forwarding  | `defineOptions({ inheritAttrs: false })` + `v-bind="$attrs"` on primary element             |
| Boolean props     | Prefix with `is`/`has` — e.g., `isLoading`, `hasError`                                      |
| Script setup      | Always `<script lang="ts" setup>`                                                           |
| No semicolons     | Code style: no semicolons, single quotes                                                    |
| Type imports      | Use `import type { ... }` for type-only imports                                             |
| Focus rings       | `tln:focus-visible:ring-3 tln:focus-visible:ring-purple-500 tln:focus-visible:outline-none` |
| No v-html         | Use text interpolation `{{ }}` or slots instead                                             |
| No business logic | Components are pure UI — no API calls, no routing, no stores                                |

## Component Catalog

### Actions (5)

| Component      | Description                                                      |
| -------------- | ---------------------------------------------------------------- |
| `TButton`      | Primary action button with variants, sizes, icons, loading state |
| `TButtonCard`  | Card-style button with icon and description                      |
| `TButtonIcon`  | Icon-only button for toolbars and compact actions                |
| `TButtonLogin` | Login page button with provider branding                         |
| `TListItem`    | Selectable list item for dropdowns and menus                     |

### Form Inputs (17)

| Component          | Description                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `TInput`           | Text input with label, hint, error states, icons                                            |
| `TInputCounter`    | Numeric input with increment/decrement buttons                                              |
| `TInputFile`       | File input with drag-and-drop support                                                       |
| `TInputOtp`        | One-time-password/verification code input with resend timer                                 |
| `TInputPhone`      | Phone number input with country code selector                                               |
| `TInputSearch`     | Search input with debounced search and clear                                                |
| `TSelectText`      | Single/multi select dropdown with search, virtual scroll                                    |
| `TSelectChips`     | Multi-select showing selections as chips                                                    |
| `TCheckbox`        | Checkbox with label, description, indeterminate state                                       |
| `TRadio`           | Radio button with label and description                                                     |
| `TSwitch`          | Toggle switch with on/off states                                                            |
| `TScale`           | Rating scale (1-N) with emoji or numeric display                                            |
| `TTextarea`        | Multi-line text input with character count                                                  |
| `TTimePicker`      | 24-hour time input with scrollable columns and manual input                                 |
| `TDatePicker`      | Single-panel date picker with typed input and Limpiar/Aplicar draft flow                    |
| `TDateRangePicker` | Dual-panel date range picker with typed inputs and Limpiar/Aplicar draft flow               |
| `TBaseSelector`    | Base combobox/selector with search and async loading                                        |
| `TChipInput`       | Text input that converts entries to chips                                                   |
| `TColorPicker`     | Color input with trigger (text + swatch) and floating HSV panel with sliders and eyedropper |

### Data Display (12)

| Component        | Description                                                                         |
| ---------------- | ----------------------------------------------------------------------------------- |
| `TAccordion`     | Expandable/collapsible content sections                                             |
| `TAlert`         | Alert dialog with actions, placement, persistent mode                               |
| `TAlertProgress` | Alert with progress bar                                                             |
| `TAvatar`        | User avatar with image, initials, or icon fallback                                  |
| `TAvatarGroup`   | Stacked group of avatars with overflow count                                        |
| `TBadge`         | Small count or status indicator                                                     |
| `TCard`          | Structured card with header, body, actions, footer slots                            |
| `TCardBase`      | Card with icon, title, description, and action slot                                 |
| `TCardUser`      | User info card with avatar, name, occupation                                        |
| `TChipFilter`    | Filterable chip with active/inactive states                                         |
| `TChipStatus`    | Status indicator chip (success, warning, error, info)                               |
| `TTable`         | Data table with sorting, pinning, pagination, dense sizes, truncation, grouped rows |

### Drag & Drop (2)

| Component     | Description                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `TChipsPanel` | Reorderable chip panel with drag & drop (built on `useTalanaDnd`): lifted drag image, keyboard reorder, touch |
| `TChipTag`    | Draggable chip with handle, optional data-type icon and status badge, remove action                           |

### Navigation (9)

| Component          | Description                                         |
| ------------------ | --------------------------------------------------- |
| `TBreadcrumbs`     | Breadcrumb navigation with separator and ellipsis   |
| `TDropdown`        | Floating dropdown container with trigger slot       |
| `THeader`          | Application header bar with logo, search, user menu |
| `THeaderSearchBar` | Search bar for the header component                 |
| `TSidebar`         | Collapsible side navigation panel                   |
| `TSidebarItem`     | Navigation item inside TSidebar                     |
| `TTabs`            | Tab container managing tab selection                |
| `TTab`             | Individual tab trigger                              |
| `TTabContent`      | Tab panel content associated with a TTab            |

### Overlays (4)

| Component   | Description                                               |
| ----------- | --------------------------------------------------------- |
| `TModal`    | Modal dialog with header, body, footer, backdrop          |
| `TDrawer`   | Slide-in panel from any edge (replaces deprecated TPanel) |
| `TPosition` | Base overlay positioning wrapper with backdrop            |
| `TTooltip`  | Floating tooltip on hover/focus                           |

### Transitions (4)

Figma Foundations transitions as wrapper components (`show` prop + slot, reduced-motion built in). See [motion.md](references/motion.md).

| Component              | Description                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| `TTransitionEnterUp`   | Enter from above + fade — modals, alerts (content over the page) |
| `TTransitionEnterDown` | Enter from below + fade — toasts, bottom-anchored content        |
| `TTransitionLateral`   | Horizontal slide (`from` end/start) — drawers, side panels       |
| `TTransitionUnfold`    | Height unfold + fade — selects, dropdowns, datepicker menus      |

### Skeletons (12)

Style from the Figma spec; dimensions mirror the real component (`size` matches the component's scale — scales are exported constants, parity-checked against each component's source in `pnpm lint`). Wrap every first-load swap with `TSkeletonGroup`; start a loading flag as `true` only when a real wait is coming. `SKELETON_DELAY_MS`/`SKELETON_MIN_DURATION_MS` are exported for consumer tests. See [loading-states.md](references/loading-states.md).

| Component              | Description                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| `TSkeleton`            | Primitive pulsing block (`width`/`height`/`circle`/`radius`)                                               |
| `TSkeletonGroup`       | Swap wrapper: `isLoading` + `#skeleton` slot, aria + anti-flash built in                                   |
| `TSkeletonText`        | Paragraph lines (`lines`), short last line                                                                 |
| `TSkeletonInput`       | Label + field mirroring TInput sizes (`size` md/lg/xl, `hasLabel`)                                         |
| `TSkeletonButton`      | Mirrors TButton sizes (`size` sm–xl, `width` override)                                                     |
| `TSkeletonButtonIcon`  | Mirrors TButtonIcon sizes (`size` xs–xl)                                                                   |
| `TSkeletonAvatar`      | Mirrors TAvatar sizes (`size` xxs–lg, circle)                                                              |
| `TSkeletonStepper`     | Stepper placeholder (`steps`, default 2 — match the real count)                                            |
| `TSkeletonOption`      | Option rows (`quantity`, `variant` plain/card)                                                             |
| `TSkeletonChip`        | Varied-width pills (`quantity`, `size` sm 24 / md 38)                                                      |
| `TSkeletonProgressBar` | Progress bar placeholder (`withText`)                                                                      |
| `TSkeletonTable`       | Standalone table placeholder (`columns`, `rows`, `hasPagination`); mounted TTable uses its own `isLoading` |

### Feedback & Content (11)

| Component        | Description                                      |
| ---------------- | ------------------------------------------------ |
| `TEmptyState`    | Placeholder for empty data states                |
| `THint`          | Helper text below form inputs                    |
| `TLabel`         | Form field label with required indicator         |
| `TLoader`        | Animated loading dots                            |
| `TLoadingScreen` | Full-screen loading splash with logo and spinner |
| `TProgressBar`   | Horizontal progress indicator                    |
| `TSpinner`       | Circular loading spinner                         |
| `TIcon`          | Wrapper for iconify-icon web component           |
| `TLogo`          | Talana logo with size variants                   |
| `TMaxCharacters` | Character count display for text inputs          |
| `TTitle`         | Section title with optional icon and description |

### Chat (2)

| Component       | Description                                                                  |
| --------------- | ---------------------------------------------------------------------------- |
| `TChatBubble`   | Chat message bubble (user/assistant) with streaming caret and thinking state |
| `TChatComposer` | Chat input bar with send pulse, busy/responding states and actions slot      |

### Notifications (3)

| Component            | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `TSectionMessage`    | Inline message banner (info, success, warning, error) |
| `TToastActions`      | Toast notification with action buttons                |
| `TToastNotification` | Floating toast notification with auto-dismiss         |

### Progress (3)

| Component     | Description                   |
| ------------- | ----------------------------- |
| `TStepper`    | Multi-step progress indicator |
| `TStepperBar` | Individual step in a stepper  |
| `TThumbnail`  | Image thumbnail with preview  |

### File Handling (1)

| Component     | Description                                            |
| ------------- | ------------------------------------------------------ |
| `TUploadFile` | File upload with drag-and-drop, progress bar and modal |

### Module Selection (1)

| Component         | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `TModuleSelector` | Module navigation dropdown with submodule drill-down |

### Layout (1)

| Component    | Description                                          |
| ------------ | ---------------------------------------------------- |
| `MainLayout` | Application shell with sidebar, header, content area |

## Deprecated Components

| Deprecated | Use Instead | Notes                                              |
| ---------- | ----------- | -------------------------------------------------- |
| `TPanel`   | `TDrawer`   | Alias export maintained for backward compatibility |

## Reference Files

Consult these for detailed component APIs (each file is focused and loadable on demand):

### Foundations

| Reference                                                 | Components / Topics                                                                                |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [design-tokens.md](references/design-tokens.md)           | Colors, typography, shadows, motion tokens, Tailwind prefix rules                                  |
| [motion.md](references/motion.md)                         | Motion tokens (durations, easings), TTransition\* components, animations                           |
| [component-patterns.md](references/component-patterns.md) | Three-file convention, tv() patterns, naming conventions                                           |
| [anti-patterns.md](references/anti-patterns.md)           | Common mistakes to avoid, deprecated components                                                    |
| [composables.md](references/composables.md)               | useSelect, useTable, useTTableOverflowTooltip, usePlacement, useFileInput, usePermission, useUtils |
| [models.md](references/models.md)                         | CompanyInterface, UserInterface, PlacementType, Select types                                       |

### Component API References

| Reference                                                   | Components                                                                                                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [buttons.md](references/buttons.md)                         | TButton, TButtonCard, TButtonIcon, TButtonLogin, TListItem                                                                                             |
| [form-text-inputs.md](references/form-text-inputs.md)       | TInput, TInputCounter, TInputFile, TInputOtp, TInputPhone, TInputSearch                                                                                |
| [form-select.md](references/form-select.md)                 | TSelectText, TSelectChips, TBaseSelector, TChipInput                                                                                                   |
| [color-picker.md](references/color-picker.md)               | TColorPicker (HSV colorspace, hue/alpha sliders, hex/opacity inputs, eyedropper)                                                                       |
| [form-controls.md](references/form-controls.md)             | TCheckbox, TRadio, TSwitch, TScale, TTextarea, TTimePicker                                                                                             |
| [date-picker.md](references/date-picker.md)                 | TDatePicker (single-panel date, typed dd/mm/aaaa input, Limpiar/Aplicar draft)                                                                         |
| [date-range-picker.md](references/date-range-picker.md)     | TDateRangePicker (dual-panel range, typed dd/mm/aaaa inputs, Limpiar/Aplicar draft)                                                                    |
| [accordion-alert.md](references/accordion-alert.md)         | TAccordion, TAlert, TAlertProgress, TAvatar, TAvatarGroup                                                                                              |
| [cards-chips.md](references/cards-chips.md)                 | TBadge, TCard, TCardBase, TCardUser, TChipFilter, TChipStatus                                                                                          |
| [drag-and-drop.md](references/drag-and-drop.md)             | useTalanaDnd (global engine: sortable, transfer, drag handle), TChipsPanel, TChipTag                                                                   |
| [table.md](references/table.md)                             | TTable (sorting, pagination, selection, column pinning, truncation, grouped rows)                                                                      |
| [navigation-widgets.md](references/navigation-widgets.md)   | TBreadcrumbs, TDropdown                                                                                                                                |
| [tabs.md](references/tabs.md)                               | TTabs, TTab, TTabContent (compound pattern)                                                                                                            |
| [app-shell.md](references/app-shell.md)                     | THeader, THeaderSearchBar, TSidebar, TSidebarItem, MainLayout                                                                                          |
| [overlays.md](references/overlays.md)                       | TModal, TDrawer, TTooltip, TPosition                                                                                                                   |
| [feedback-indicators.md](references/feedback-indicators.md) | TEmptyState, THint, TLabel, TLoader, TProgressBar, TSpinner                                                                                            |
| [loading-states.md](references/loading-states.md)           | TSkeletonGroup wrapper, TSkeleton primitive + sized templates (Text, Input, Button, Avatar, Option, Chip, Stepper, ProgressBar, Table), TLoadingScreen |
| [content-display.md](references/content-display.md)         | TIcon, TLogo, TMaxCharacters, TTitle                                                                                                                   |
| [notifications.md](references/notifications.md)             | TSectionMessage, TToastActions, TToastNotification                                                                                                     |
| [chat.md](references/chat.md)                               | TChatBubble, TChatComposer (AI chat bubbles + composer)                                                                                                |
| [progress.md](references/progress.md)                       | TStepper, TStepperBar, TThumbnail                                                                                                                      |
| [file-handling.md](references/file-handling.md)             | TUploadFile                                                                                                                                            |

## Scripts

Run these to get live data from the codebase:

```bash
# List all exported components
bash skills/talanify-next/scripts/list-components.sh

# Get the TypeScript API for a specific component
bash skills/talanify-next/scripts/get-component-api.sh TButton
```

## Composables

| Composable                  | Purpose                                                     | Used by                                       |
| --------------------------- | ----------------------------------------------------------- | --------------------------------------------- |
| `useSelect`                 | Virtual scrolling, async search, multi-select               | TSelectText                                   |
| `useTable`                  | Cell styling, pagination helpers                            | TTable                                        |
| `useTTableOverflowTooltip`  | Internal overflow and tooltip logic                         | TTable                                        |
| `usePlacement`              | Position class mapping                                      | TModal, TAlert, TToastNotification, TPosition |
| `useUtils`                  | `randomId()`, URL helpers                                   | Multiple components                           |
| `usePermission`             | Module/company config checks                                | Consuming applications (public export)        |
| `useFileInput`              | File validation and preview                                 | TInputFile, TUploadFile                       |
| `useTalanaDnd`              | Global drag & drop engine (public)                          | TChipsPanel, any sortable list                |
| `useCalendarAutoNavigation` | Dual-panel month sync + animated travel                     | TDateRangePicker                              |
| `useCompanySelector`        | Company filtering UI state                                  | TBaseSelector                                 |
| `useModuleSelector`         | Active module/submodule matching                            | TModuleSelector                               |
| `useColorPickerPanel`       | Panel state: HSV/hex/opacity parsing, eyedropper (internal) | TColorPicker                                  |

## Design Tokens Quick Reference

**Colors:** `purple` (brand), `gray`, `red`, `yellow`, `green`, `blue`, `orange`, `neutral`, `black` (opacity), `white` (opacity) — each with 50-900 scale.

**Typography:** `headline-lg/md/sm`, `title-lg/md`, `body-lg/md/sm`, `label`, `caption`

**Font:** Inter — `font-regular` (400), `font-medium` (500), `font-bold` (700)

**Shadows:** `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`, `shadow-inner`

See [design-tokens.md](references/design-tokens.md) for complete values.
