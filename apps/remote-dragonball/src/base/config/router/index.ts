import { createRouter, createWebHistory } from 'vue-router'
import { characterRoutes } from '@/modules/character/presentation/routes/character.routes'

// Standalone router — used only when this remote runs on its own. Under the
// host, `characterRoutes` is consumed through the federated `./routes` contract
// and mounted inside the host's layout instead.
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{ path: '/', redirect: { name: 'character-list' } }, ...characterRoutes],
})

export default router
