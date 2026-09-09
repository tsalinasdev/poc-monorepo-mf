import { mount, flushPromises } from '@vue/test-utils'
import router, { registerRemoteRoutes } from '@/router'
import App from '@/App.vue'

// Remote routes are contributed at runtime now, so the shell has to be composed
// before anything can be rendered — exactly as main.ts does it.
beforeAll(async () => {
  await registerRemoteRoutes(router)
})

// Exercises the REAL shell composition: the real router (whose remote routes
// resolve to the contract stubs) rendering the real App (the layout is static
// chrome mounted by App.vue). That is the only way to check the navbar's
// selected state the way a user sees it.
//
// The chrome is the PeopleFirst navigation ported from kpi-project: Header,
// MainNavbar (items from the remote catalog) and generic Breadcrumbs.
const SELECTED_CLASS = 'text-Text-Other-Brand'

async function renderAt(path: string) {
  await router.push(path)
  await router.isReady()
  const wrapper = mount(App, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

function navLinks(wrapper: Awaited<ReturnType<typeof renderAt>>) {
  return wrapper.findAll('nav[aria-label="Navegación de secciones"] ul li a')
}

it('shows one nav entry per remote section', async () => {
  const wrapper = await renderAt('/gestion-kpi')

  expect(navLinks(wrapper).map((link) => link.text())).toEqual(['Gestión KPI', 'Dragon Ball'])
})

it('marks the kpi entry as selected while on a kpi route', async () => {
  const wrapper = await renderAt('/gestion-kpi')
  const [kpi, dragonball] = navLinks(wrapper)

  expect(kpi?.classes()).toContain(SELECTED_CLASS)
  expect(kpi?.attributes('aria-current')).toBe('page')
  expect(dragonball?.classes()).not.toContain(SELECTED_CLASS)
})

it('moves the selection when navigating to the other remote', async () => {
  const wrapper = await renderAt('/dragon-ball')
  const [kpi, dragonball] = navLinks(wrapper)

  expect(dragonball?.classes()).toContain(SELECTED_CLASS)
  expect(dragonball?.attributes('aria-current')).toBe('page')
  expect(kpi?.classes()).not.toContain(SELECTED_CLASS)
})

// Regression guard: `active-class` is inclusive on purpose. Switching it to
// `exact-active-class` would drop the highlight on every detail screen.
it('keeps the section selected while on one of its detail screens', async () => {
  const wrapper = await renderAt('/dragon-ball/1')
  const [kpi, dragonball] = navLinks(wrapper)

  expect(dragonball?.classes()).toContain(SELECTED_CLASS)
  expect(kpi?.classes()).not.toContain(SELECTED_CLASS)
})

it('renders the PeopleFirst chrome around the remote screen', async () => {
  const wrapper = await renderAt('/gestion-kpi')

  expect(wrapper.find('header').exists()).toBe(true) // Header portado
  expect(wrapper.find('nav[aria-label="Navegación de secciones"]').exists()).toBe(true) // MainNavbar portado
  expect(wrapper.find('main').text()).toContain('list') // stubbed remote screen
})

it('renders the generic breadcrumb trail for the current section', async () => {
  const wrapper = await renderAt('/gestion-kpi')

  const crumbs = wrapper.text()
  expect(crumbs).toContain('Inicio')
  expect(crumbs).toContain('Gestión KPI')
})

it('appends the deep path segments to the breadcrumb trail', async () => {
  const wrapper = await renderAt('/dragon-ball/1')

  const crumbs = wrapper.text()
  expect(crumbs).toContain('Dragon Ball')
  expect(crumbs).toContain('1')
})
