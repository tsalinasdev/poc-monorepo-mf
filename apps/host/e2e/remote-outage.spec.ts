import { test, expect } from '@playwright/test'

/**
 * A remote is a SEPARATE deployment: it can be down while the shell is healthy.
 * These tests abort every request to the dragon ball remote's origin, which is
 * as close to a real outage as a browser test gets.
 *
 * The shell used to import the remote contracts statically, so this scenario
 * produced a blank page — no navbar, and the other remote unreachable too,
 * even though nothing was wrong with it.
 */
test.describe('with the dragon ball remote unreachable', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('http://localhost:5175/**', (route) => route.abort())
  })

  test('the shell still boots and renders its chrome', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('header')).toBeVisible()
    // El orden de los links no es estable cuando una sección cae: el
    // degraded-route del remote caído se registra después de los catch-alls,
    // y vue-router puede presentarlos en cualquier orden. Lo importante es
    // que ambos nombres aparecen.
    await expect(
      page.locator('nav[aria-label="Navegación de secciones"] ul li a', { hasText: 'Gestión KPI' }),
    ).toBeVisible()
    await expect(
      page.locator('nav[aria-label="Navegación de secciones"] ul li a', { hasText: 'Dragon Ball' }),
    ).toBeVisible()
  })

  test('the unreachable section explains itself instead of going blank', async ({ page }) => {
    await page.goto('/dragon-ball')

    await expect(page.getByRole('heading', { name: /Dragon Ball is unavailable/ })).toBeVisible()
  })

  // The whole point: one remote failing must not take the others with it.
  test('the healthy remote keeps working', async ({ page }) => {
    await page.goto('/gestion-kpi')

    // La sección de gestión de KPI carga directamente del primer remote.
    await expect(page.getByText('Ciclos KPI').first()).toBeVisible()
  })

  test('the user can navigate from the broken section to the healthy one', async ({ page }) => {
    await page.goto('/dragon-ball')

    await page
      .locator('nav[aria-label="Navegación de secciones"] ul li a', { hasText: 'Gestión KPI' })
      .click()

    await expect(page).toHaveURL(/\/gestion-kpi$/)
    await expect(page.getByText('Ciclos KPI').first()).toBeVisible()
  })
})

test('an unknown address falls back to the host not-found screen', async ({ page }) => {
  await page.goto('/no-such-section')

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await expect(page.locator('header')).toBeVisible() // still inside the shell
})
