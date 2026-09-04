import { flushPromises } from '@vue/test-utils'
import { asValue } from 'awilix'
import { container } from '@/base/config/di/container'
import { Result } from '@/base/lib/domain/result'
import { Paginated } from '@/base/lib/domain/paginated'
import { HttpServiceException } from '@/base/config/http/exception/http-service.exception'
import type { PokemonsFinder } from '@/modules/pokemon/application/use-cases/pokemons-finder/pokemons-finder.use-case'
import { usePokemonListViewModel } from '@/modules/pokemon/presentation/screens/pokemon-list/usePokemonListViewModel'
import { buildPokemonSummary } from '../../../builders/pokemon.builder'
import { withSetup } from '../../../../../helpers/with-setup'

const execute = vi.fn()

beforeEach(() => {
  execute.mockReset()
  container.register({ pokemonsFinder: asValue({ execute } as unknown as PokemonsFinder) })
})

it('exposes pokemon cards when the use case succeeds', async () => {
  execute.mockResolvedValue(
    Result.ok(new Paginated([buildPokemonSummary({ name: 'pikachu' })], 1302, 1, 20)),
  )

  const { result, app } = withSetup(() => usePokemonListViewModel())
  await flushPromises()

  expect(result.cards.value).toHaveLength(1)
  expect(result.cards.value[0]?.name).toBe('Pikachu')
  expect(result.totalPages.value).toBe(66)
  expect(result.error.value).toBeNull()
  app.unmount()
})

it('maps the DomainException code to a UI message on failure', async () => {
  execute.mockResolvedValue(Result.err(new HttpServiceException(500, 'Internal error')))

  const { result, app } = withSetup(() => usePokemonListViewModel())
  await flushPromises()

  expect(result.error.value).toBe('The Pokédex is unreachable right now, please try again')
  expect(result.cards.value).toHaveLength(0)
  app.unmount()
})
