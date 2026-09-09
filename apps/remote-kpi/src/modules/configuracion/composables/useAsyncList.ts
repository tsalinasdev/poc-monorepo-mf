import { ref, type Ref } from 'vue'

export interface UseAsyncList<T, Args extends unknown[] = []> {
  list: Ref<T[]>
  loading: Ref<boolean>
  error: Ref<unknown>
  refresh: (...args: Args) => Promise<void>
}

/**
 * loading/error/try-catch-finally repetido en cada composable de listado
 * (useCiclos, useKpis, useAsignaciones, useResultados). `loadFn` recibe los
 * mismos args que `refresh()` y devuelve el array a asignar a `list`.
 */
export function useAsyncList<T, Args extends unknown[] = []>(
  loadFn: (...args: Args) => Promise<T[]>,
): UseAsyncList<T, Args> {
  const list = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const error = ref<unknown>(null)

  async function refresh(...args: Args): Promise<void> {
    loading.value = true
    error.value = null
    try {
      list.value = await loadFn(...args)
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  return { list, loading, error, refresh }
}
