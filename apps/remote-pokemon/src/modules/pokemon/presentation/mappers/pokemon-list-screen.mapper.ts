import { capitalize } from '@/base/lib/utils'
import type { PokemonSummary } from '../../domain/entities/pokemon-summary.entity'
import type { PokemonCardModel } from '../models/pokemon-card.model'

export class PokemonListScreenMapper {
  static pokemonSummaryDomainToPokemonCardModel(summary: PokemonSummary): PokemonCardModel {
    return {
      id: summary.id,
      slug: summary.name,
      name: capitalize(summary.name),
      numberLabel: `#${String(summary.id).padStart(3, '0')}`,
      imageUrl: summary.imageUrl,
    }
  }
}
