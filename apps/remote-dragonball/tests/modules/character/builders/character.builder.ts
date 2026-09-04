import { CharacterSummary } from '@/modules/character/domain/entities/character-summary.entity'
import { Character } from '@/modules/character/domain/entities/character.entity'

export function buildCharacterSummary(overrides: Partial<CharacterSummary> = {}): CharacterSummary {
  return new CharacterSummary(
    overrides.id ?? 1,
    overrides.name ?? 'Goku',
    overrides.imageUrl ?? 'https://dragonball-api.com/characters/goku_normal.webp',
    overrides.race ?? 'Saiyan',
    overrides.affiliation ?? 'Z Fighter',
  )
}

export function buildCharacter(overrides: Partial<Character> = {}): Character {
  return new Character(
    overrides.id ?? 1,
    overrides.name ?? 'Goku',
    overrides.imageUrl ?? 'https://dragonball-api.com/characters/goku_normal.webp',
    overrides.race ?? 'Saiyan',
    overrides.gender ?? 'Male',
    overrides.affiliation ?? 'Z Fighter',
    overrides.ki ?? '60.000.000',
    overrides.maxKi ?? '90 Septillion',
    overrides.description ?? 'El protagonista de la serie.',
    overrides.originPlanet ?? {
      name: 'Tierra',
      isDestroyed: false,
      imageUrl: 'https://dragonball-api.com/planetas/Tierra.webp',
    },
    overrides.transformations ?? [],
  )
}
