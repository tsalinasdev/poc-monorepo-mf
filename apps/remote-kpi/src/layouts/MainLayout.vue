<script setup lang="ts">
import { useRoute, useRouter, type RouteLocationNormalizedLoaded, type Router } from 'vue-router'
import { TTab } from '@talana/talanify-next'
import SecondNavbar from './components/SecondNavbar.vue'
import { CONFIGURACION_TABS, type ConfiguracionTab } from '@/modules/configuracion/tabs'

const route: RouteLocationNormalizedLoaded = useRoute()
const router: Router = useRouter()

/**
 * Portado de kpi-project/src/layouts/MainLayout.vue, con el chrome compartido
 * extraído: Header, MainNavbar y Breadcrumbs hoy viven en el HOST
 * (apps/host/src/modules/shell) porque son la navegación que comparten todos
 * los remotes. Aquí queda la navegación interna del módulo: SecondNavbar y el
 * wrapper de card con tabs de configuración.
 */
function go(tab: ConfiguracionTab): void {
  router.push({ name: tab.name })
}
</script>

<template>
  <div class="flex-1 flex flex-col">
    <SecondNavbar />

    <!--
      El área del remote ocupa todo el ancho (chrome del shell ya va
      full-width). La acotación horizontal — el equivalente al "margin
      horizontal" del PeopleFirst original — vive en los 60px del card y de
      la vista sin card; así la card blanca deja de verse como un bloque
      centrado y se apoya en los bordes del viewport.
    -->
    <main class="w-full py-6 flex flex-col items-center">
      <!-- Vista sin card (detalle, etc.) — acotada al ancho razonable del card. -->
      <div v-if="route.meta.hideCard" class="w-full px-30">
        <div class="mx-auto w-full max-w-[1400px] flex flex-col gap-4">
          <RouterView />
        </div>
      </div>

      <!-- Vista normal: card con tabs. Full-width con padding lateral de 60px. -->
      <div
        v-else
        class="w-full px-30"
      >
        <div
          class="w-full bg-Surface-Main rounded-2xl border border-Stroke-Neutral flex flex-col overflow-hidden"
        >
          <nav
            v-if="!route.meta.hideTabs"
            class="w-full pt-4 px-4 border-b border-Stroke-Neutral flex"
            aria-label="Tabs internos"
          >
            <TTab
              v-for="tab in CONFIGURACION_TABS"
              :key="tab.id"
              variant="primary"
              class="cursor-pointer"
              :is-active="route.name === tab.name"
              @click="go(tab)"
            >
              <img :src="tab.icon" alt="" class="w-6 h-6" />
              {{ tab.label }}
            </TTab>
          </nav>
          <div class="p-4 flex flex-col gap-4">
            <RouterView />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
