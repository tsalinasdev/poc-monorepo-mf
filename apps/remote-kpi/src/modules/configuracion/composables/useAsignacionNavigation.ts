import { computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { useRoute, useRouter, type RouteLocationNormalizedLoaded } from 'vue-router'
import { resolveGroupUsers } from '../utils/asignacionUsuarios'
import type { Asignacion } from '@api/configuracion/asignaciones/types'
import type { Usuario } from '@api/configuracion/usuarios/get_usuarios.php.ts'

interface UseAsignacionNavigationArgs {
  asignacionesDelCiclo: Ref<Asignacion[]>
  asignacionId: Ref<number>
  userId: Ref<number>
}

interface UseAsignacionNavigation {
  hasPrev: ComputedRef<boolean>
  hasNext: ComputedRef<boolean>
  navigate: (delta: number) => void
  goBack: () => void
}

// Navegación prev/next entre las filas (asignación × usuario) del ciclo
// actual, en el mismo orden en que se resuelven los grupos de cada
// asignación (igual orden que se ve en AsignacionView).
export function useAsignacionNavigation({
  asignacionesDelCiclo,
  asignacionId,
  userId,
}: UseAsignacionNavigationArgs): UseAsignacionNavigation {
  const route: RouteLocationNormalizedLoaded = useRoute()
  const router = useRouter()

  const orderedRows = computed(() =>
    asignacionesDelCiclo.value.flatMap((a) =>
      resolveGroupUsers(a).map((u: Usuario) => ({ asignacionId: a.id, userId: u.id })),
    ),
  )

  const currentIndex = computed(() =>
    orderedRows.value.findIndex(
      (r) => r.asignacionId === asignacionId.value && r.userId === userId.value,
    ),
  )

  const hasPrev = computed(() => currentIndex.value > 0)
  const hasNext = computed(() => currentIndex.value < orderedRows.value.length - 1)

  function navigate(delta: number): void {
    const next = orderedRows.value[currentIndex.value + delta]
    if (!next) return
    router.push({
      name: 'asignacion-detalle',
      params: { asignacionId: String(next.asignacionId), userId: String(next.userId) },
      query: route.query,
    })
  }

  function goBack(): void {
    // Por nombre, no por path: el basename lo pone el host cuando el remote
    // corre federado y un path absoluto lo duplicaría.
    router.push({ name: 'asignacion' })
  }

  return { hasPrev, hasNext, navigate, goBack }
}
