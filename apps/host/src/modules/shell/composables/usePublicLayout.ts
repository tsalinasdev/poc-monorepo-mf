import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export interface NavItem {
  label: string
  routeName: string
  isSelected: boolean
  hasDropdown: boolean
}

export interface Section {
  label: string
  routeName: string
  path: string
  hasDropdown: boolean
}

/**
 * The navigation is DERIVED from the mounted routes, not hardcoded: any route
 * that carries `meta.navLabel` shows up here. Adding a remote means touching
 * the router composition only — this layout never changes.
 *
 * `currentSection` answers "which section am I in" for any chrome that needs
 * it (breadcrumbs), not just for the navbar links.
 */
export function usePublicLayout() {
  const router = useRouter()
  const route = useRoute()

  const sections = computed<Section[]>(() =>
    router
      .getRoutes()
      .filter((record) => typeof record.meta?.navLabel === 'string' && record.name)
      .map((record) => ({
        label: record.meta.navLabel as string,
        routeName: String(record.name),
        // The section's base path lives in meta (set by the host router
        // composition): the route's own `path` is the catch-all template
        // (e.g. `/pokemons/:pathMatch(.*)*`), not the section prefix.
        path: (record.meta?.basePath as string | undefined) ?? record.path,
        hasDropdown: record.meta?.hasDropdown === true,
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

  const navItems = computed<NavItem[]>(() =>
    sections.value.map((section) => ({
      label: section.label,
      routeName: section.routeName,
      isSelected: isSelected(section.path),
      hasDropdown: section.hasDropdown,
    })),
  )

  /**
   * The section the current URL belongs to, or `undefined` outside every
   * section (e.g. the 404 screen). Prefix match mirrors `isSelected`.
   */
  const currentSection = computed<Section | undefined>(() =>
    sections.value.find((section) => isSelected(section.path)),
  )

  return { navItems, currentSection }
}
