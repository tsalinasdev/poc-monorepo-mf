import { test, expect } from '@playwright/test'

/**
 * A remote is a SEPARATE deployment: it can be down while the shell is healthy.
 * These tests abort every request to the pokemon remote's origin, which is as
 * close to a real outage as a browser test gets.
 *
 * The shell used to import the remote contracts statically, so this scenario
 * produced a blank page — no navbar, and the dragon ball remote unreachable
 * too, even though nothing was wrong with it.
 */
test.describe('with the pokemon remote unreachable', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('http://localhost:5174/**', (route) => route.abort())
  })

  test('the shell still boots and renders its chrome', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('header nav')).toBeVisible()
    await expect(page.locator('nav ul a')).toHaveText(['Pokédex', 'Dragon Ball'])
  })

  test('the unreachable section explains itself instead of going blank', async ({ page }) => {
    await page.goto('/pokemons')

    await expect(page.getByRole('heading', { name: /Pokédex is unavailable/ })).toBeVisible()
  })

  // The whole point: one remote failing must not take the others with it.
  test('the healthy remote keeps working', async ({ page }) => {
    await page.goto('/dragon-ball')

    await expect(page.getByRole('heading', { name: 'Dragon Ball', level: 1 })).toBeVisible()
    await expect(page.locator('main ul li').first()).toBeVisible({ timeout: 20_000 })
  })

  test('the user can navigate from the broken section to the healthy one', async ({ page }) => {
    await page.goto('/pokemons')

    await page.locator('nav ul a', { hasText: 'Dragon Ball' }).click()

    await expect(page).toHaveURL(/\/dragon-ball$/)
    await expect(page.getByRole('heading', { name: 'Dragon Ball', level: 1 })).toBeVisible()
  })
})

test('an unknown address falls back to the host not-found screen', async ({ page }) => {
  await page.goto('/no-such-section')

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await expect(page.locator('header nav')).toBeVisible() // still inside the shell
})
