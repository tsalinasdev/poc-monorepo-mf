<script setup lang="ts">
/**
 * Chrome del shell "People first", portado desde kpi-project/src/layouts/MainLayout.vue.
 *
 * De ese layout llegan al host sus tres piezas de navegación compartida:
 * Header, MainNavbar y Breadcrumbs. El resto del MainLayout (SecondNavbar,
 * card con tabs de configuración) queda en el remote de KPI: es navegación
 * interna del módulo, no del shell.
 *
 * The chrome belongs to the host. Its links come from usePublicLayout, which
 * derives them from whatever routes the remotes contributed.
 */
import { RouterView } from 'vue-router'
import AppHeader from './AppHeader.vue'
import MainNavbar from './MainNavbar.vue'
import ShellBreadcrumbs from './ShellBreadcrumbs.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-Background-Main text-Text-Dark-Primary">
    <AppHeader />
    <MainNavbar />
    <ShellBreadcrumbs />

    <div class="flex-1 flex flex-col bg-Background-Main">
      <main>
        <!-- Remote screens render here -->
        <RouterView />
      </main>
    </div>
  </div>
</template>
