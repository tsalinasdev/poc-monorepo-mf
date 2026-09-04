import type { AxiosHttpClient } from '@/base/config/http/axios.http-client'
import { HttpServiceException } from '@/base/config/http/exception/http-service.exception'
import { HttpPokemonRepository } from '@/modules/pokemon/infrastructure/repositories/http-pokemon.repository'
import { PokemonSummary } from '@/modules/pokemon/domain/entities/pokemon-summary.entity'
import { Pokemon } from '@/modules/pokemon/domain/entities/pokemon.entity'
import { FindPokemonsProps } from '@/modules/pokemon/domain/props/find-pokemons.props'
import { FindPokemonProps } from '@/modules/pokemon/domain/props/find-pokemon.props'

describe('HttpPokemonRepository', () => {
  const get = vi.fn()
  const httpClient = { get } as unknown as AxiosHttpClient
  const repository = new HttpPokemonRepository(httpClient)

  beforeEach(() => {
    get.mockReset()
  })

  it('maps the list response to paginated domain summaries', async () => {
    get.mockResolvedValue({
      data: {
        count: 1302,
        results: [{ name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' }],
      },
      status: 200,
      headers: {},
    })

    const result = await repository.findAll(new FindPokemonsProps(1, 20))

    expect(get).toHaveBeenCalledWith('/pokemon?limit=20&offset=0')
    expect(result.isOk()).toBe(true)
    const paginated = result.getValue()
    expect(paginated.items[0]).toBeInstanceOf(PokemonSummary)
    expect(paginated.items[0]?.id).toBe(1)
    expect(paginated.total).toBe(1302)
  })

  it('maps the detail response to a domain entity', async () => {
    get.mockResolvedValue({
      data: {
        id: 25,
        name: 'pikachu',
        height: 4,
        weight: 60,
        types: [{ slot: 1, type: { name: 'electric' } }],
        stats: [{ base_stat: 35, stat: { name: 'hp' } }],
        sprites: { front_default: 'https://example.com/25.png' },
      },
      status: 200,
      headers: {},
    })

    const result = await repository.findByName(new FindPokemonProps('pikachu'))

    expect(result.isOk()).toBe(true)
    expect(result.getValue()).toBeInstanceOf(Pokemon)
    expect(result.getValue().stats).toEqual([{ name: 'hp', value: 35 }])
  })

  it('converts a 404 into PokemonNotFoundException', async () => {
    get.mockRejectedValue(new HttpServiceException(404, 'Not Found'))

    const result = await repository.findByName(new FindPokemonProps('missingno'))

    expect(result.isErr()).toBe(true)
    expect(result.getError().code).toBe('POKEMON_NOT_FOUND')
  })

  it('falls back to the HttpServiceException for any other failure', async () => {
    get.mockRejectedValue(new HttpServiceException(500, 'Internal error'))

    const result = await repository.findByName(new FindPokemonProps('pikachu'))

    expect(result.getError().code).toBe('HTTP_SERVICE_ERROR')
  })
})
