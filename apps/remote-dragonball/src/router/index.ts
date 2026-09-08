import { createRouter, createWebHistory } from 'vue-router'
import { characterRoutes } from '@/modules/character/router'

// Standalone router — used only when this remote runs on its own. Under the
// host, the bridge recreates the router with the section's basename; these
// same relative routes resolve under it.
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: characterRoutes,
})

export default router
