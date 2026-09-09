import { test, expect, type Page } from '@playwright/test'

/**
 * The real thing: the host shell loading BOTH remotes over Module Federation
 * in a browser. If the shared singletons, the remote entries or the federated
 * CSS were broken, these tests are what would notice.
 *
 * The shell chrome is the PeopleFirst navigation ported from kpi-project:
 * Header + MainNavbar + Breadcrumbs. The remote sections render inside it.
 */

function navLink(page: Page, label: string) {
  return page.locator('nav[aria-label="Navegación de secciones"] ul li a', { hasText: label })
}

async function expectSelected(page: Page, selected: string, notSelected: string) {
  await expect(navLink(page, selected)).toHaveAttribute('aria-current', 'page')
  await expect(navLink(page, notSelected)).not.toHaveAttribute('aria-current', 'page')
}

test('the shell renders both remotes in its navbar', async ({ page }) => {
  await page.goto('/')

  // El remote de KPI hace un sub-redirect a /ciclos una vez cargado; lo que
  // el shell garantiza es que '/' resuelve dentro de su sección. Ver
  // router/index.ts: el shell-index redirect al primer remote.
  await expect(page).toHaveURL(/\/gestion-kpi/)
  await expect(page.locator('nav[aria-label="Navegación de secciones"] ul li a')).toHaveText([
    'Gestión KPI',
    'Dragon Ball',
  ])
})

test('the kpi remote renders inside the host layout', async ({ page }) => {
  await page.goto('/gestion-kpi')

  await expect(page.locator('header')).toBeVisible() // Header portado de kpi-project
  await expect(page.locator('nav[aria-label="Navegación de secciones"]')).toBeVisible() // MainNavbar portado
  // Navegación interna del remote (portada de kpi-project): tabs de configuración.
  await expect(page.getByText('Ciclos KPI').first()).toBeVisible()
  await expect(page.getByText('Asignación').first()).toBeVisible()
  await expectSelected(page, 'Gestión KPI', 'Dragon Ball')
})

test('the breadcrumb trail names the current section', async ({ page }) => {
  await page.goto('/dragon-ball/1')

  await expect(page.getByText('Inicio')).toBeVisible()
  await expect(page.getByText('Dragon Ball').last()).toBeVisible()
})

test('clicking the navbar switches to the dragon ball remote', async ({ page }) => {
  await page.goto('/gestion-kpi')

  await navLink(page, 'Dragon Ball').click()

  await expect(page).toHaveURL(/\/dragon-ball\/?$/)
  await expect(page.getByRole('heading', { name: 'Dragon Ball', level: 1 })).toBeVisible()
  await expectSelected(page, 'Dragon Ball', 'Gestión KPI')
})

// The regression this whole navbar rework came from: list and detail are sibling
// routes, so RouterLink's active-class dropped the highlight on detail screens.
test('the selection survives navigating into a remote detail screen', async ({ page }) => {
  await page.goto('/dragon-ball/1')

  await expectSelected(page, 'Dragon Ball', 'Gestión KPI')
})

test('the dragon ball remote fetches and renders live data', async ({ page }) => {
  await page.goto('/dragon-ball')
  await expect(page.locator('main ul li').first()).toBeVisible({ timeout: 20_000 })
  expect(await page.locator('main ul li').count()).toBeGreaterThan(0)
})

test('loading both remotes produces no console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/gestion-kpi')
  await expect(page.getByText('Ciclos KPI').first()).toBeVisible()
  await navLink(page, 'Dragon Ball').click()
  await expect(page.getByRole('heading', { name: 'Dragon Ball', level: 1 })).toBeVisible()

  expect(errors).toEqual([])
})
