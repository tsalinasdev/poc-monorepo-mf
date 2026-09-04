import { createRouter, createWebHistory } from 'vue-router'
import { pokemonRoutes } from '@/modules/pokemon/presentation/routes/pokemon.routes'

// Standalone router — used only when this remote runs on its own. Under the
// host, `pokemonRoutes` is consumed through the federated `./routes` contract
// and mounted inside the host's layout instead.
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{ path: '/', redirect: { name: 'pokemon-list' } }, ...pokemonRoutes],
})

export default router
