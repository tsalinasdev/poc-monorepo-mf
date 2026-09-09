<script setup lang="ts">
/**
 * Barra principal del shell, portada desde kpi-project/src/layouts/components/MainNavbar.vue.
 *
 * La versión de kpi-project hardcodeaba el menú de PeopleFirst (Inicio, Clima,
 * Desempeño, …). Acá los ítems vienen del catálogo de remotes (`usePublicLayout`
 * deriva de las rutas montadas con `meta.navLabel`): agregar una sección es
 * tocar `router/remotes.ts`, nunca esta barra.
 *
 * La selección se calcula por prefijo de URL (no por RouterLink's active-class):
 * el listado y el detalle de un remote son rutas hermanas, no padre e hijo.
 */
import { RouterLink } from 'vue-router'
import { usePublicLayout } from '../composables/usePublicLayout'

const { navItems } = usePublicLayout()
</script>

<template>
  <nav
    aria-label="Navegación de secciones"
    class="w-full h-10 px-30 bg-Surface-Alternative border-y border-Stroke-NeutralAlternative flex justify-between items-center"
  >
    <ul class="flex items-center h-full m-0 p-0 list-none">
      <li
        v-for="item in navItems"
        :key="item.routeName"
        :class="[
          'h-full px-4 flex items-center justify-center gap-1 cursor-pointer border-b-2 transition-all duration-200',
          item.isSelected ? 'border-Stroke-Brand hover:bg-black/5' : 'border-transparent hover:bg-black/5',
        ]"
      >
        <RouterLink
          :to="{ name: item.routeName }"
          :aria-current="item.isSelected ? 'page' : undefined"
          :class="[
            'flex items-center gap-1 text-xs leading-4 font-[Inter] whitespace-nowrap',
            item.isSelected ? 'text-Text-Other-Brand font-bold' : 'text-Text-Dark-Primary font-medium',
          ]"
        >
          {{ item.label }}
        </RouterLink>

        <img v-if="item.hasDropdown" src="/img/chevron_down.svg" alt="" class="w-3 h-3 ml-0.5" />
      </li>
    </ul>

    <div class="flex items-center gap-2 h-full">
      <button
        class="w-8 h-8 rounded flex justify-center items-center hover:bg-black/5 transition-colors"
        aria-label="Libro"
      >
        <img src="/img/book.svg" alt="" class="w-6 h-6" />
      </button>

      <button
        class="w-8 h-8 rounded flex justify-center items-center hover:bg-black/5 transition-colors"
        aria-label="Ayuda"
      >
        <img src="/img/help.svg" alt="" class="w-6 h-6" />
      </button>
    </div>
  </nav>
</template>
