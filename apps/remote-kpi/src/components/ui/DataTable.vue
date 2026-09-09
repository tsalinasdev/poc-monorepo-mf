<script setup lang="ts">
// @ts-nocheck — see .claude/skills/no-skip-typescript (TODO: anotar este archivo en el sprint de tipado del módulo de configuración)
/**
 * Talanify no re-exporta `TableDataBody` desde el entry-point; se define
 * localmente con la forma real para no importar subpaths privados de la
 * librería (el codegen de TTable la usa como `Record<string, unknown>[]`).
 */

import { computed, ref, watch, useSlots, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { TTable, TButtonIcon, TChipStatus, type TTableHeaderItem } from '@talana/talanify-next'
import NoResults from './NoResults.vue'
import RowActionMenu from './RowActionMenu.vue'

type TableDataBody = Record<string, unknown>[]

// Paginación nativa de TTable (@tanstack/vue-table): al no pasarle `total-pages`,
// TTable pagina sola el `dataBody` completo. Si se necesita paginación server-side
// (el backend devuelve solo la página actual), agregar un prop `server` que vuelva
// a pasar `total-pages` y le entregue a TTable solo la página ya recortada.

defineOptions({ inheritAttrs: false })

export interface DataTableColumn extends TTableHeaderItem {
  key: string
  name: string
  align?: 'left' | 'right' | 'center'
  width?: number
  pinned?: 'left' | 'right'
  statusVariants?: Record<string, string>
  format?: (row: Record<string, unknown>) => string
}

export interface DataTableRowAction {
  label: string
  onClick: (row: Record<string, unknown>) => void
}

const props = withDefaults(
  defineProps<{
    dataHead: DataTableColumn[]
    dataBody: TableDataBody
    actionType?: 'approve-reject' | 'reset-validate' | 'row-actions' | null
    rowActions?: DataTableRowAction[]
    selectable?: boolean
  }>(),
  { actionType: null, rowActions: () => [], selectable: false },
)

const selected = defineModel<Record<string, unknown>[]>('selected', { default: () => [] })
const tableRef = ref<{
  handleToggleAllRowsSelected?: () => void
  handleResetSelection?: () => void
  updateRowSelectionFromIds?: (ids: (number | string)[]) => void
  // TTable expone su elemento raíz como $el; tipar como HTMLElementLike
  // sin acoplar al tipo interno del componente.
  $el?: { querySelector: (selector: string) => HTMLElement | null }
} | null>(null)

const emit = defineEmits<{
  approve:    [row: Record<string, unknown>]
  reject:     [row: Record<string, unknown>]
  reset:      [row: Record<string, unknown>]
  validate:   [row: Record<string, unknown>]
  clearSearch: []
}>()

defineExpose({
  selectAll: () => tableRef.value?.handleToggleAllRowsSelected?.(),
  clearSelection: () => tableRef.value?.handleResetSelection?.(),
  selectByIds: (ids: (number | string)[]) => tableRef.value?.updateRowSelectionFromIds?.(ids),
  getPageItemCount: () => paginatedData.value.length,
  getPageIds: () => paginatedData.value.map((r: Record<string, unknown>) => String(r.id)),
})

const slots = useSlots()

const currentPage = ref(1)
const itemsPerPage = ref(10)

const totalItems = computed(() => props.dataBody.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return props.dataBody.slice(start, start + itemsPerPage.value)
})

watch(totalPages, (tp) => {
  if (currentPage.value > tp) currentPage.value = Math.max(tp, 1)
})

const columns = computed<DataTableColumn[]>(() => {
  if (!props.actionType) return [...props.dataHead]
  const width = ['approve-reject', 'reset-validate'].includes(props.actionType) ? 96 : 80
  return [
    ...props.dataHead,
    { key: 'actions', name: 'Acciones', pinned: 'right', width, align: 'center' },
  ]
})

const ALIGN_CLASS = { left: 'tln:text-left', right: 'tln:text-right', center: 'tln:text-center' }

const autoAlignedColumns = computed(() =>
  props.dataHead.filter((col) => col.align && col.align !== 'left' && !slots[col.key]),
)

const statusColumns = computed(() =>
  props.dataHead.filter((col) => col.statusVariants && !slots[col.key]),
)

const passthroughSlots = computed(() => {
  const excluded = new Set(['actions'])
  // Slot de Vue tipado de forma genérica: la firma exacta varía por slot
  // dinámico. La parte del template (#[name]="slotProps") no consume
  // tipos del slot, así que `Slot` de Vue 3 es suficiente.
  const result: Record<string, unknown> = {}
  for (const name in slots) {
    if (!excluded.has(name)) result[name] = slots[name]
  }
  return result
})

// El estado vacío se pinta como overlay ANCLADO AL CONTENEDOR (dt-root, ancho
// real de la tarjeta), no dentro del <td colspan> de TTable (ancho total
// scrolleable de las columnas) — así queda centrado en lo que se ve, sin
// importar cuánto scroll horizontal tenga la tabla. Solo el header debe
// depender del ancho scrolleable; por eso medimos su alto para no tapar los
// nombres de columna con el overlay.
const headerHeight = ref(0)
let headerObserver: ResizeObserver | null = null

function measureHeader() {
  const theadEl = tableRef.value?.$el?.querySelector('thead')
  headerHeight.value = theadEl?.offsetHeight ?? 0
}

onMounted(() => {
  nextTick(measureHeader)
  const theadEl = tableRef.value?.$el?.querySelector('thead')
  if (theadEl && typeof ResizeObserver !== 'undefined') {
    headerObserver = new ResizeObserver(measureHeader)
    headerObserver.observe(theadEl)
  }
})

onBeforeUnmount(() => headerObserver?.disconnect())

watch(() => props.dataHead, () => nextTick(measureHeader))
</script>

<template>
  <div class="dt-root">
  <TTable
    ref="tableRef"
    :data-head="columns"
    :data-body="dataBody"
    :total-items="totalItems"
    :current-page="currentPage"
    :items-per-page="itemsPerPage"
    :is-selectable="selectable"
    :hidden-pagination="!dataBody.length"
    v-bind="$attrs"
    @update:selected="(selected = $event as unknown as Record<string, unknown>[])"
    @update:page="currentPage = $event"
    @update:items-per-page="itemsPerPage = $event"
  >
      <template v-for="col in autoAlignedColumns" :key="col.key" #[col.key]="{ row }">
        <div class="tln:w-full" :class="ALIGN_CLASS[col.align as keyof typeof ALIGN_CLASS]">
          {{ row[col.key] }}
        </div>
      </template>
      <template v-for="col in statusColumns" :key="`status-${col.key}`" #[col.key]="{ row }">
        <TChipStatus :variant="((col.statusVariants?.[String(row[col.key])] as string) ?? 'secondary') as 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'primary' | 'feature' | 'new' | 'beta'">
          {{ String(row[col.key]).charAt(0).toUpperCase() + String(row[col.key]).slice(1) }}
        </TChipStatus>
      </template>
      <template v-for="(_, name) in passthroughSlots" :key="name" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps ?? {}" />
      </template>
      <template #actions="{ row }">
        <div class="w-full flex justify-center gap-1">
          <template v-if="actionType === 'approve-reject'">
            <TButtonIcon
              icon="material-symbols:check-circle-outline"
              variant="tertiary"
              size="sm"
              aria-label="Aprobar"
              @click="emit('approve', row)"
            />
            <TButtonIcon
              icon="material-symbols:cancel-outline"
              variant="tertiary"
              size="sm"
              aria-label="Rechazar"
              @click="emit('reject', row)"
            />
          </template>
          <template v-else-if="actionType === 'reset-validate'">
            <TButtonIcon
              icon="material-symbols:restart-alt"
              variant="tertiary"
              size="sm"
              aria-label="Resetear"
              @click="emit('reset', row)"
            />
            <TButtonIcon
              icon="material-symbols:check-circle-outline"
              variant="tertiary"
              size="sm"
              aria-label="Validar"
              @click="emit('validate', row)"
            />
          </template>
          <RowActionMenu v-else-if="rowActions.length" :actions="rowActions" :row="row" />
          <TButtonIcon
            v-else
            icon="material-symbols:more-vert"
            variant="tertiary"
            size="sm"
            aria-label="Opciones"
          />
        </div>
      </template>

      <template #empty>
        <!-- Reserva el alto de fila (para que la tarjeta no colapse), el
             contenido real se pinta afuera como overlay — ver dt-empty-overlay. -->
        <div class="empty-row-spacer" />
      </template>
    </TTable>

    <div v-if="!dataBody.length" class="dt-empty-overlay" :style="{ top: headerHeight + 'px' }">
      <NoResults @clear="emit('clearSearch')" />
    </div>
  </div>
</template>

<style scoped>
:deep(input[type='checkbox']) {
  cursor: pointer;
}

.dt-root {
  position: relative;
}

.empty-row-spacer {
  min-height: 320px;
}

/* Overlay anclado a dt-root (ancho real de la tarjeta), no al <td colspan>
   de TTable (ancho total scrolleable) — por eso queda centrado en lo que se
   ve sin importar el scroll horizontal. `top` se mide en JS para no tapar
   el header, que es lo único que debe depender del ancho scrolleable. */
.dt-empty-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
