import { flushPromises } from '@vue/test-utils'
import { vi } from 'vitest'
import { ApiError } from '@/modules/shared/api/http'
import type { PokemonListPage } from '@/modules/pokemon/services/pokemons.services'
import { usePokemons } from '@/modules/pokemon/composables/usePokemons'
import { buildPokemonCard } from '../builders/pokemon.builders'
import { withSetup } from '../../../helpers/with-setup'

vi.mock('@/modules/pokemon/services/pokemons.services', () => ({
  getPokemons: vi.fn(),
}))

const getPokemons = vi.mocked(
  (await import('@/modules/pokemon/services/pokemons.services')).getPokemons,
)

beforeEach(() => {
  getPokemons.mockReset()
})

it('exposes pokemon cards when the service succeeds', async () => {
  const listPage: PokemonListPage = { items: [buildPokemonCard()], total: 1302 }
  getPokemons.mockResolvedValue(listPage)

  const { result, app } = withSetup(() => usePokemons())
  await flushPromises()

  expect(result.cards.value).toHaveLength(1)
  expect(result.cards.value[0]?.name).toBe('Pikachu')
  expect(result.totalPages.value).toBe(66)
  expect(result.error.value).toBeNull()
  app.unmount()
})

it('maps a service failure to a UI message', async () => {
  getPokemons.mockRejectedValue(new ApiError('Internal error', 500))

  const { result, app } = withSetup(() => usePokemons())
  await flushPromises()

  expect(result.error.value).toBe('The Pokédex is unreachable right now, please try again')
  expect(result.cards.value).toHaveLength(0)
  app.unmount()
})
