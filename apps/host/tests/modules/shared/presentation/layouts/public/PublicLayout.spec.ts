import { mount, flushPromises } from '@vue/test-utils'
import router, { registerRemoteRoutes } from '@/base/config/router'

// Remote routes are contributed at runtime now, so the shell has to be composed
// before anything can be rendered — exactly as main.ts does it.
beforeAll(async () => {
  await registerRemoteRoutes(router)
})

// Exercises the REAL shell composition: the real router (whose remote routes
// resolve to the contract stubs) rendering the real layout. That is the only
// way to check the navbar's selected state the way a user sees it.
const SELECTED_CLASS = 'bg-gray-900'

async function renderAt(path: string) {
  await router.push(path)
  await router.isReady()
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

function navLinks(wrapper: Awaited<ReturnType<typeof renderAt>>) {
  return wrapper.findAll('nav ul a')
}

it('shows one nav entry per remote section', async () => {
  const wrapper = await renderAt('/pokemons')

  expect(navLinks(wrapper).map((link) => link.text())).toEqual(['Pokédex', 'Dragon Ball'])
})

it('marks the pokemon entry as selected while on a pokemon route', async () => {
  const wrapper = await renderAt('/pokemons')
  const [pokemon, dragonball] = navLinks(wrapper)

  expect(pokemon?.classes()).toContain(SELECTED_CLASS)
  expect(pokemon?.attributes('aria-current')).toBe('page')
  expect(dragonball?.classes()).not.toContain(SELECTED_CLASS)
})

it('moves the selection when navigating to the other remote', async () => {
  const wrapper = await renderAt('/dragon-ball')
  const [pokemon, dragonball] = navLinks(wrapper)

  expect(dragonball?.classes()).toContain(SELECTED_CLASS)
  expect(dragonball?.attributes('aria-current')).toBe('page')
  expect(pokemon?.classes()).not.toContain(SELECTED_CLASS)
})

// Regression guard: `active-class` is inclusive on purpose. Switching it to
// `exact-active-class` would drop the highlight on every detail screen.
it('keeps the section selected while on one of its detail screens', async () => {
  const wrapper = await renderAt('/dragon-ball/1')
  const [pokemon, dragonball] = navLinks(wrapper)

  expect(dragonball?.classes()).toContain(SELECTED_CLASS)
  expect(pokemon?.classes()).not.toContain(SELECTED_CLASS)
})

it('renders the remote screen inside the layout chrome', async () => {
  const wrapper = await renderAt('/pokemons')

  expect(wrapper.find('header nav').exists()).toBe(true)
  expect(wrapper.find('main').text()).toContain('list') // stubbed remote screen
})
