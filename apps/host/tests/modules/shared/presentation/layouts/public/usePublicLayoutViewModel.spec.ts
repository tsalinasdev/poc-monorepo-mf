import { createApp, type App } from 'vue'
import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router'
import { usePublicLayoutViewModel } from '@/modules/shared/presentation/layouts/public/usePublicLayoutViewModel'

/**
 * Mounts the composable under a real router sitting at `path`.
 *
 * The app is returned still mounted on purpose: vue-router resets its current
 * route to START_LOCATION when the app unmounts, so reading the ViewModel after
 * unmounting would always report "/" and no selection. Each test unmounts once
 * it is done asserting.
 */
async function withRouterAt<T>(
  routes: RouteRecordRaw[],
  path: string,
  composable: () => T,
): Promise<{ result: T; app: App }> {
  let result!: T
  const router = createRouter({ history: createMemoryHistory(), routes })
  const app = createApp({
    setup() {
      result = composable()
      return () => null
    },
  })
  app.use(router)
  await router.push(path)
  await router.isReady()
  app.mount(document.createElement('div'))
  return { result, app }
}

const stubComponent = { template: '<div />' }

// Mirrors how a remote contributes routes: a list route that opts into the nav
// with `meta.navLabel`, plus a sibling detail route that does not.
const routes: RouteRecordRaw[] = [
  { path: '/alpha', name: 'a-list', component: stubComponent, meta: { navLabel: 'Alpha' } },
  { path: '/alpha/:id', name: 'a-detail', component: stubComponent },
  { path: '/beta', name: 'b-list', component: stubComponent, meta: { navLabel: 'Beta' } },
  { path: '/beta/:id', name: 'b-detail', component: stubComponent },
]

it('derives one nav item per route that opts in with meta.navLabel', async () => {
  const { result, app } = await withRouterAt(routes, '/alpha', usePublicLayoutViewModel)

  expect(result.navItems.value.map((item) => item.label)).toEqual(['Alpha', 'Beta'])
  expect(result.navItems.value.map((item) => item.routeName)).toEqual(['a-list', 'b-list'])
  app.unmount()
})

it('selects the section matching the current route', async () => {
  const { result, app } = await withRouterAt(routes, '/beta', usePublicLayoutViewModel)

  expect(result.navItems.value.map((item) => item.isSelected)).toEqual([false, true])
  app.unmount()
})

// The list and detail routes of a remote are siblings, not parent and child, so
// selection is computed from the URL prefix instead of vue-router's active state.
it('keeps the section selected on its detail routes', async () => {
  const { result, app } = await withRouterAt(routes, '/alpha/42', usePublicLayoutViewModel)

  expect(result.navItems.value.map((item) => item.isSelected)).toEqual([true, false])
  app.unmount()
})

it('follows the selection when the route changes', async () => {
  const { result, app } = await withRouterAt(routes, '/alpha', usePublicLayoutViewModel)
  expect(result.navItems.value.map((item) => item.isSelected)).toEqual([true, false])

  await app.config.globalProperties.$router.push('/beta')

  expect(result.navItems.value.map((item) => item.isSelected)).toEqual([false, true])
  app.unmount()
})

it('selects nothing outside every section', async () => {
  const extra = [...routes, { path: '/', name: 'root', component: stubComponent }]
  const { result, app } = await withRouterAt(extra, '/', usePublicLayoutViewModel)

  expect(result.navItems.value.every((item) => !item.isSelected)).toBe(true)
  app.unmount()
})

// Guards against a prefix match that is not a real section boundary.
it('does not select a section whose path is a mere string prefix of another', async () => {
  const overlapping: RouteRecordRaw[] = [
    { path: '/alpha', name: 'a-list', component: stubComponent, meta: { navLabel: 'Alpha' } },
    {
      path: '/alpha-beta',
      name: 'ab-list',
      component: stubComponent,
      meta: { navLabel: 'Alpha Beta' },
    },
  ]

  const { result, app } = await withRouterAt(overlapping, '/alpha-beta', usePublicLayoutViewModel)

  expect(result.navItems.value.map((item) => item.isSelected)).toEqual([false, true])
  app.unmount()
})

// This is what makes the shell remote-agnostic: no remote opting in means no
// nav, and a new remote appears without touching the layout.
it('returns nothing when no route opts in', async () => {
  const { result, app } = await withRouterAt(
    [{ path: '/a', name: 'a-list', component: stubComponent }],
    '/a',
    usePublicLayoutViewModel,
  )

  expect(result.navItems.value).toEqual([])
  app.unmount()
})
