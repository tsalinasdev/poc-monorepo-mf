import { capitalize } from '@/base/lib/utils'
import type { Pokemon } from '../../domain/entities/pokemon.entity'
import type { PokemonDetailModel } from '../models/pokemon-detail.model'

const MAX_BASE_STAT = 255

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
}

export class PokemonDetailScreenMapper {
  static pokemonDomainToPokemonDetailModel(pokemon: Pokemon): PokemonDetailModel {
    return {
      name: capitalize(pokemon.name),
      numberLabel: `#${String(pokemon.id).padStart(3, '0')}`,
      imageUrl: pokemon.imageUrl,
      heightLabel: `${(pokemon.heightDm / 10).toFixed(1)} m`,
      weightLabel: `${(pokemon.weightHg / 10).toFixed(1)} kg`,
      types: pokemon.types.map(capitalize),
      stats: pokemon.stats.map((stat) => ({
        label: STAT_LABELS[stat.name] ?? capitalize(stat.name),
        value: stat.value,
        percent: Math.round((stat.value / MAX_BASE_STAT) * 100),
      })),
    }
  }
}
