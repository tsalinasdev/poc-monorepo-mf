import { vi } from 'vitest'
import { httpGet, ApiError, NotFoundError } from '@/modules/shared/api/http'
import { getPokemon, getPokemons } from '@/modules/pokemon/services/pokemons.services'
import { buildApiPokemon, buildApiPokemonList } from '../builders/pokemon.builders'

vi.mock('@/modules/shared/api/http', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  httpGet: vi.fn(),
}))

const mockedGet = vi.mocked(httpGet)

beforeEach(() => {
  mockedGet.mockReset()
})

describe('getPokemons', () => {
  it('requests the page with limit/offset and derives the card from the resource URL', async () => {
    mockedGet.mockResolvedValue(buildApiPokemonList())

    const page = await getPokemons(2, 20)

    expect(mockedGet).toHaveBeenCalledWith('/pokemon?limit=20&offset=20')
    expect(page.items[0]).toMatchObject({
      id: 1,
      slug: 'bulbasaur',
      name: 'Bulbasaur',
      numberLabel: '#001',
    })
    expect(page.total).toBe(1302)
  })

  it('derives the official-artwork URL when the list carries no sprite', async () => {
    mockedGet.mockResolvedValue(buildApiPokemonList())

    const page = await getPokemons(1, 20)

    expect(page.items[0]?.imageUrl).toContain('official-artwork/1.png')
  })
})

describe('getPokemon', () => {
  it('requests the detail and maps labels for the screen', async () => {
    mockedGet.mockResolvedValue(buildApiPokemon())

    const detail = await getPokemon('pikachu')

    expect(mockedGet).toHaveBeenCalledWith('/pokemon/pikachu')
    expect(detail.name).toBe('Pikachu')
    expect(detail.numberLabel).toBe('#025')
    expect(detail.heightLabel).toBe('0.4 m')
    expect(detail.weightLabel).toBe('6.0 kg')
    expect(detail.types).toEqual(['Electric'])
    expect(detail.stats).toEqual([{ label: 'HP', value: 35, percent: 14 }])
  })

  it('prefers the official artwork over the default sprite', async () => {
    mockedGet.mockResolvedValue(
      buildApiPokemon({
        sprites: {
          front_default: 'https://example.com/25.png',
          other: { 'official-artwork': { front_default: 'https://example.com/art.png' } },
        },
      }),
    )

    const detail = await getPokemon('pikachu')

    expect(detail.imageUrl).toBe('https://example.com/art.png')
  })

  it('converts a 404 into a NotFoundError', async () => {
    mockedGet.mockRejectedValue(new ApiError('Not Found', 404))

    await expect(getPokemon('missingno')).rejects.toThrow(NotFoundError)
  })

  it('keeps any other API failure as-is', async () => {
    mockedGet.mockRejectedValue(new ApiError('Internal error', 500))

    await expect(getPokemon('pikachu')).rejects.toThrow('Internal error')
  })
})
