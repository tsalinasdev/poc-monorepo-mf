<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { usePublicLayoutViewModel } from './usePublicLayoutViewModel'

const { navItems } = usePublicLayoutViewModel()
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <!-- The shell chrome belongs to the host. Its links come from the ViewModel,
         which derives them from whatever routes the remotes contributed. -->
    <header class="border-b border-gray-200 bg-white">
      <nav class="mx-auto flex max-w-5xl items-center gap-4 p-4">
        <RouterLink to="/" class="text-lg font-bold">Federated demo</RouterLink>
        <span class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">host shell</span>

        <ul class="ml-auto flex gap-2">
          <li v-for="item in navItems" :key="item.routeName">
            <!-- The View stays passive: whether an entry is selected is decided
                 by the ViewModel, not by RouterLink's active-class. -->
            <RouterLink
              :to="{ name: item.routeName }"
              :aria-current="item.isSelected ? 'page' : undefined"
              class="rounded-full px-4 py-1.5 text-sm font-medium transition"
              :class="
                item.isSelected
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              "
            >
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>
    </header>

    <main>
      <!-- Remote screens render here -->
      <RouterView />
    </main>
  </div>
</template>
