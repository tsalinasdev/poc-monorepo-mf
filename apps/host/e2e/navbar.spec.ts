import { test, expect, type Page } from '@playwright/test'

/**
 * The real thing: the host shell loading BOTH remotes over Module Federation in
 * a browser. If the shared singletons, the remote entries or the federated CSS
 * were broken, these tests are what would notice.
 */

const SELECTED = 'bg-gray-900'

function navLink(page: Page, label: string) {
  return page.locator('nav ul a', { hasText: label })
}

async function expectSelected(page: Page, selected: string, notSelected: string) {
  await expect(navLink(page, selected)).toHaveClass(new RegExp(SELECTED))
  await expect(navLink(page, selected)).toHaveAttribute('aria-current', 'page')
  await expect(navLink(page, notSelected)).not.toHaveClass(new RegExp(SELECTED))
}

test('the shell renders both remotes in its navbar', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/pokemons$/) // landing redirect
  await expect(page.locator('nav ul a')).toHaveText(['Pokédex', 'Dragon Ball'])
})

test('the pokemon remote renders inside the host layout', async ({ page }) => {
  await page.goto('/pokemons')

  await expect(page.locator('header nav')).toBeVisible() // host chrome
  await expect(page.getByRole('heading', { name: 'Pokédex', level: 1 })).toBeVisible()
  await expectSelected(page, 'Pokédex', 'Dragon Ball')
})

test('clicking the navbar switches to the dragon ball remote', async ({ page }) => {
  await page.goto('/pokemons')

  await navLink(page, 'Dragon Ball').click()

  await expect(page).toHaveURL(/\/dragon-ball$/)
  await expect(page.getByRole('heading', { name: 'Dragon Ball', level: 1 })).toBeVisible()
  await expectSelected(page, 'Dragon Ball', 'Pokédex')
})

// The regression this whole navbar rework came from: list and detail are sibling
// routes, so RouterLink's active-class dropped the highlight on detail screens.
test('the selection survives navigating into a remote detail screen', async ({ page }) => {
  await page.goto('/dragon-ball/1')

  await expectSelected(page, 'Dragon Ball', 'Pokédex')
})

test('remote styles ship with the federated contract', async ({ page }) => {
  await page.goto('/pokemons')

  // `font-bold` is only ever used inside the remote's screens, so the host's own
  // Tailwind build never emits it. If the remote's stylesheet had not travelled
  // with its exposed module, this heading would fall back to the default weight.
  const heading = page.getByRole('heading', { name: 'Pokédex', level: 1 })
  await expect(heading).toHaveCSS('font-weight', '700')
})

test('loading both remotes produces no console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/pokemons')
  await expect(page.getByRole('heading', { name: 'Pokédex', level: 1 })).toBeVisible()
  await navLink(page, 'Dragon Ball').click()
  await expect(page.getByRole('heading', { name: 'Dragon Ball', level: 1 })).toBeVisible()

  expect(errors).toEqual([])
})

test('both remotes fetch and render live data', async ({ page }) => {
  await page.goto('/pokemons')
  await expect(page.locator('main ul li').first()).toBeVisible({ timeout: 20_000 })
  expect(await page.locator('main ul li').count()).toBeGreaterThan(0)

  await navLink(page, 'Dragon Ball').click()
  await expect(page.locator('main ul li').first()).toBeVisible({ timeout: 20_000 })
  expect(await page.locator('main ul li').count()).toBeGreaterThan(0)
})
