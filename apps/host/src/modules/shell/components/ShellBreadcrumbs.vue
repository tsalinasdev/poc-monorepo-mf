<script setup lang="ts">
/**
 * Breadcrumbs del shell, portados desde kpi-project/src/layouts/components/Breadcrumbs.vue.
 *
 * La versión de kpi-project leía datos del módulo (USUARIOS_SEED,
 * CONFIGURACION_TABS). Como el shell es remote-agnóstico, acá se derivan del
 * path: `Inicio › {sección} › {segmentos}` con los segmentos embellecidos
 * (kebab-case → Title Case). El breadcrumb "rico" (ej. el nombre del usuario de
 * una asignación) es cosa del remote, no del shell.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { TBreadcrumbs } from '@talana/talanify-next'
import { usePublicLayout } from '../composables/usePublicLayout'

interface Crumb {
  text: string
  path: string
}

const route = useRoute()
const { currentSection } = usePublicLayout()

function prettify(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const breadcrumbs = computed<Crumb[]>(() => {
  const section = currentSection.value
  if (!section) return []

  const crumbs: Crumb[] = [
    { text: 'Inicio', path: '/' },
    { text: section.label, path: section.path },
  ]

  const rest = route.path.startsWith(`${section.path}/`)
    ? route.path.slice(section.path.length + 1)
    : ''
  const segments = rest.split('/').filter(Boolean)

  segments.forEach((segment, index) => {
    crumbs.push({
      text: prettify(decodeURIComponent(segment)),
      // BreadcrumbItem exige `path: string`: el último apunta al path actual.
      path: `${section.path}/${segments.slice(0, index + 1).join('/')}`,
    })
  })

  return crumbs
})
</script>

<template>
  <div v-if="breadcrumbs.length" class="w-full px-30 py-2">
    <TBreadcrumbs :breadcrumbs="breadcrumbs" />
  </div>
</template>
