import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { NavItemModel } from '../../models/nav-item.model'

/**
 * The navigation is DERIVED from the mounted routes, not hardcoded: any remote
 * route that carries `meta.navLabel` shows up here. Adding a remote means
 * touching the router composition only — this layout never changes.
 */
export function usePublicLayoutViewModel() {
  const router = useRouter()
  const route = useRoute()

  const sections = computed(() =>
    router
      .getRoutes()
      .filter((record) => typeof record.meta?.navLabel === 'string' && record.name)
      .map((record) => ({
        label: record.meta.navLabel as string,
        routeName: String(record.name),
        path: record.path,
      })),
  )

  /**
   * Selection is computed from the URL, NOT from RouterLink's active class.
   * A remote's list and detail routes are siblings (`/dragon-ball` and
   * `/dragon-ball/:id`), not parent and child, so vue-router does not consider
   * the list route active while a detail screen is open. Matching on the path
   * prefix is what keeps the section highlighted across the whole section.
   */
  function isSelected(sectionPath: string): boolean {
    return route.path === sectionPath || route.path.startsWith(`${sectionPath}/`)
  }

  const navItems = computed<NavItemModel[]>(() =>
    sections.value.map((section) => ({
      label: section.label,
      routeName: section.routeName,
      isSelected: isSelected(section.path),
    })),
  )

  return { navItems }
}
