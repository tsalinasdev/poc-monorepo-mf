import type { CharacterSummary } from '../../domain/entities/character-summary.entity'
import type { CharacterCardModel } from '../models/character-card.model'

export class CharacterListScreenMapper {
  static characterSummaryDomainToCharacterCardModel(summary: CharacterSummary): CharacterCardModel {
    return {
      id: summary.id,
      name: summary.name,
      imageUrl: summary.imageUrl,
      race: summary.race,
      affiliation: summary.affiliation,
    }
  }
}
