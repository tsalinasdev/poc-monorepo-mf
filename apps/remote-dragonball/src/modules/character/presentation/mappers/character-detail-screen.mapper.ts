import type { Character } from '../../domain/entities/character.entity'
import type { CharacterDetailModel } from '../models/character-detail.model'

export class CharacterDetailScreenMapper {
  static characterDomainToCharacterDetailModel(character: Character): CharacterDetailModel {
    return {
      name: character.name,
      imageUrl: character.imageUrl,
      description: character.description,
      race: character.race,
      gender: character.gender,
      affiliation: character.affiliation,
      kiLabel: `Ki ${character.ki}`,
      maxKiLabel: `Max ki ${character.maxKi}`,
      originPlanet: character.originPlanet
        ? {
            name: character.originPlanet.name,
            statusLabel: character.originPlanet.isDestroyed ? 'Destroyed' : 'Intact',
            imageUrl: character.originPlanet.imageUrl,
          }
        : null,
      transformations: character.transformations.map((transformation) => ({
        id: transformation.id,
        name: transformation.name,
        imageUrl: transformation.imageUrl,
        kiLabel: `Ki ${transformation.ki}`,
      })),
    }
  }
}
