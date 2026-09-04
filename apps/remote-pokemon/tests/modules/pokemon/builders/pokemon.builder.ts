import { PokemonSummary } from '@/modules/pokemon/domain/entities/pokemon-summary.entity'
import { Pokemon } from '@/modules/pokemon/domain/entities/pokemon.entity'

export function buildPokemonSummary(overrides: Partial<PokemonSummary> = {}): PokemonSummary {
  return new PokemonSummary(
    overrides.id ?? 25,
    overrides.name ?? 'pikachu',
    overrides.imageUrl ?? 'https://example.com/sprites/25.png',
  )
}

export function buildPokemon(overrides: Partial<Pokemon> = {}): Pokemon {
  return new Pokemon(
    overrides.id ?? 25,
    overrides.name ?? 'pikachu',
    overrides.imageUrl ?? 'https://example.com/sprites/25.png',
    overrides.heightDm ?? 4,
    overrides.weightHg ?? 60,
    overrides.types ?? ['electric'],
    overrides.stats ?? [{ name: 'hp', value: 35 }],
  )
}
