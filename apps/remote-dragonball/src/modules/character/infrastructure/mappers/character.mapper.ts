import { CharacterSummary } from '../../domain/entities/character-summary.entity'
import { Character } from '../../domain/entities/character.entity'
import type { CharacterListItemDto } from '../dtos/character-list-response.dto'
import type { CharacterResponseDto } from '../dtos/character-response.dto'

// The API returns null for several optional fields; the domain does not model
// absence for them, so the mapper is where nulls become explicit fallbacks.
const UNKNOWN = 'Unknown'

export class CharacterMapper {
  static toSummary(item: CharacterListItemDto): CharacterSummary {
    return new CharacterSummary(
      item.id,
      item.name,
      item.image,
      item.race ?? UNKNOWN,
      item.affiliation ?? UNKNOWN,
    )
  }

  static toDomain(raw: CharacterResponseDto): Character {
    return new Character(
      raw.id,
      raw.name,
      raw.image,
      raw.race ?? UNKNOWN,
      raw.gender ?? UNKNOWN,
      raw.affiliation ?? UNKNOWN,
      raw.ki ?? UNKNOWN,
      raw.maxKi ?? UNKNOWN,
      raw.description,
      raw.originPlanet
        ? {
            name: raw.originPlanet.name,
            isDestroyed: raw.originPlanet.isDestroyed,
            imageUrl: raw.originPlanet.image,
          }
        : null,
      (raw.transformations ?? []).map((transformation) => ({
        id: transformation.id,
        name: transformation.name,
        imageUrl: transformation.image,
        ki: transformation.ki,
      })),
    )
  }
}
