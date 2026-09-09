<script setup lang="ts">
import { ref } from 'vue'

interface NavItem {
  id: string
  label: string
  isActive: boolean
}

// Submenú interno del módulo de gestión de KPI. Hardcoded por ahora — los
// items de Configuración/Dashboard/Reportes/Administración son propios del
// módulo y no se derivan de un catálogo todavía.
const navItems = ref<NavItem[]>([
  { id: 'configuracion', label: 'Configuración', isActive: true },
  { id: 'dashboard', label: 'Dashboard', isActive: false },
  { id: 'reportes', label: 'Reportes', isActive: false },
  { id: 'administracion', label: 'Administración', isActive: false },
])

function selectItem(id: string): void {
  navItems.value.forEach((item) => {
    item.isActive = item.id === id
  })
}
</script>

<template>
  <nav class="w-full bg-white flex flex-col justify-center">
    <ul
      class="w-full px-30 border-y border-Stroke-Neutral flex justify-end items-center gap-4 m-0 list-none bg-Surface-Main"
    >
      <li
        v-for="item in navItems"
        :key="item.id"
        :class="[
          'h-10 px-2 flex justify-center items-center gap-0.5 cursor-pointer border-b-2 transition-all duration-200',
          item.isActive
            ? 'border-Stroke-Primary'
            : 'border-transparent hover:bg-black/5 hover:border-Stroke-Neutral',
        ]"
        @click="selectItem(item.id)"
      >
        <span
          :class="[
            'text-sm font-[Inter] leading-5 whitespace-nowrap text-center',
            item.isActive
              ? 'text-Text-Other-Brand font-bold'
              : 'text-Text-Dark-Primary font-medium',
          ]"
        >
          {{ item.label }}
        </span>
      </li>
    </ul>
  </nav>
</template>
