import { Result } from '@/base/lib/domain/result'
import { Paginated } from '@/base/lib/domain/paginated'
import { HttpServiceException } from '@/base/config/http/exception/http-service.exception'
import { PokemonsFinder } from '@/modules/pokemon/application/use-cases/pokemons-finder/pokemons-finder.use-case'
import { FindPokemonsProps } from '@/modules/pokemon/domain/props/find-pokemons.props'
import type { PokemonRepository } from '@/modules/pokemon/domain/ports/pokemon.repository'
import { buildPokemonSummary } from '../../../builders/pokemon.builder'

describe('PokemonsFinder', () => {
  const findAll = vi.fn()
  const findByName = vi.fn()
  const pokemonRepository: PokemonRepository = { findAll, findByName }
  const useCase = new PokemonsFinder(pokemonRepository)

  it('returns the paginated summaries from the repository', async () => {
    const paginated = new Paginated([buildPokemonSummary()], 1302, 1, 20)
    findAll.mockResolvedValue(Result.ok(paginated))

    const result = await useCase.execute(new FindPokemonsProps(1, 20))

    expect(result.isOk()).toBe(true)
    expect(result.getValue()).toBe(paginated)
    expect(findAll).toHaveBeenCalledWith(new FindPokemonsProps(1, 20))
  })

  it('propagates the domain error when the repository fails', async () => {
    findAll.mockResolvedValue(Result.err(new HttpServiceException(500, 'Internal error')))

    const result = await useCase.execute(new FindPokemonsProps(1, 20))

    expect(result.isErr()).toBe(true)
    expect(result.getError().code).toBe('HTTP_SERVICE_ERROR')
  })
})
