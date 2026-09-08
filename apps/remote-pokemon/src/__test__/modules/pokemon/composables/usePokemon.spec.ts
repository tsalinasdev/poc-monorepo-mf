import { flushPromises } from '@vue/test-utils'
import { vi } from 'vitest'
import { NotFoundError } from '@/modules/shared/api/http'
import { usePokemon } from '@/modules/pokemon/composables/usePokemon'
import { buildPokemonDetail } from '../builders/pokemon.builders'
import { withSetup } from '../../../helpers/with-setup'

vi.mock('@/modules/pokemon/services/pokemons.services', () => ({
  getPokemon: vi.fn(),
}))

const getPokemon = vi.mocked(
  (await import('@/modules/pokemon/services/pokemons.services')).getPokemon,
)

beforeEach(() => {
  getPokemon.mockReset()
})

it('exposes the pokemon detail when the service succeeds', async () => {
  getPokemon.mockResolvedValue(buildPokemonDetail())

  const { result, app } = withSetup(() => usePokemon('pikachu'))
  await flushPromises()

  expect(result.detail.value?.name).toBe('Pikachu')
  expect(result.error.value).toBeNull()
  app.unmount()
})

it('tells a missing pokemon apart from an unreachable Pokédex', async () => {
  getPokemon.mockRejectedValue(new NotFoundError('Pokemon missingno not found'))

  const { result, app } = withSetup(() => usePokemon('missingno'))
  await flushPromises()

  expect(result.error.value).toBe('Pokémon not found — check the name and try again')
  app.unmount()
})
