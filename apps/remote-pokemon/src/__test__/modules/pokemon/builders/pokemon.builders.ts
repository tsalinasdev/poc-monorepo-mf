import type { ApiPokemon, ApiPokemonList } from '@/modules/pokemon/services/pokemons.services'
import type { PokemonCard, PokemonDetail } from '@/modules/pokemon/models/pokemon.model'

export function buildApiPokemonList(overrides: Partial<ApiPokemonList> = {}): ApiPokemonList {
  return {
    count: 1302,
    results: [{ name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' }],
    ...overrides,
  }
}

export function buildApiPokemon(overrides: Partial<ApiPokemon> = {}): ApiPokemon {
  return {
    id: 25,
    name: 'pikachu',
    height: 4,
    weight: 60,
    types: [{ slot: 1, type: { name: 'electric' } }],
    stats: [{ base_stat: 35, stat: { name: 'hp' } }],
    sprites: { front_default: 'https://example.com/25.png' },
    ...overrides,
  }
}

export function buildPokemonCard(overrides: Partial<PokemonCard> = {}): PokemonCard {
  return {
    id: 25,
    slug: 'pikachu',
    name: 'Pikachu',
    numberLabel: '#025',
    imageUrl: 'https://example.com/sprites/25.png',
    ...overrides,
  }
}

export function buildPokemonDetail(overrides: Partial<PokemonDetail> = {}): PokemonDetail {
  return {
    name: 'Pikachu',
    numberLabel: '#025',
    imageUrl: 'https://example.com/25.png',
    heightLabel: '0.4 m',
    weightLabel: '6.0 kg',
    types: ['Electric'],
    stats: [{ label: 'HP', value: 35, percent: 14 }],
    ...overrides,
  }
}
