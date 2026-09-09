import { computed, type ComputedRef, type Ref } from 'vue'

export interface UseListViewArgs<T> {
  search: Ref<string>
  addLabel: string
  onAdd: () => void
  onEdit: (row: T) => void
  onDelete: (row: T) => void
}

export interface FilterConfigItem {
  type: 'text'
  key: string
  label: string
  placeholder: string
}

export interface ToolbarButton {
  type: string
  label: string
  onClick: () => void
}

export interface RowAction<T = unknown> {
  label: string
  onClick: (row: T) => void
}

export interface UseListView<T = unknown> {
  filterConfig: FilterConfigItem[]
  filterValues: ComputedRef<{ search: string }>
  toolbarButtons: ToolbarButton[]
  rowActions: RowAction<T>[]
}

/**
 * Estado compartido por todas las listas: el `search` reactivo del padre se
 * refleja como `filterValues.search` (consumido por `AppToolbar`) y el padre
 * provee los handlers de agregar/editar/eliminar. La vista de tabla los une.
 */
export function useListView<T = unknown>({
  search,
  addLabel,
  onAdd,
  onEdit,
  onDelete,
}: UseListViewArgs<T>): UseListView<T> {
  const filterConfig: FilterConfigItem[] = [
    { type: 'text', key: 'search', label: 'Buscar por nombre', placeholder: 'Buscar' },
  ]

  const filterValues = computed({
    get: () => ({ search: search.value }),
    set: (v) => {
      search.value = v.search
    },
  })

  const toolbarButtons: ToolbarButton[] = [{ type: 'add', label: addLabel, onClick: onAdd }]

  const rowActions: RowAction<T>[] = [
    { label: 'Editar', onClick: onEdit },
    { label: 'Eliminar', onClick: onDelete },
  ]

  return { filterConfig, filterValues, toolbarButtons, rowActions }
}
