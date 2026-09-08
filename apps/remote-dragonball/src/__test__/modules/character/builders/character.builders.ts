import type {
  ApiCharacter,
  ApiCharacterItem,
  ApiCharacterList,
} from '@/modules/character/services/characters.services'
import type { CharacterCard, CharacterDetail } from '@/modules/character/models/character.model'

export function buildApiCharacterItem(overrides: Partial<ApiCharacterItem> = {}): ApiCharacterItem {
  return {
    id: 1,
    name: 'Goku',
    image: 'goku.webp',
    race: 'Saiyan',
    affiliation: 'Z Fighter',
    ...overrides,
  }
}

export function buildApiCharacterList(overrides: Partial<ApiCharacterList> = {}): ApiCharacterList {
  return {
    items: [buildApiCharacterItem()],
    meta: { totalItems: 58, itemCount: 1, itemsPerPage: 20, totalPages: 3, currentPage: 1 },
    ...overrides,
  }
}

export function buildApiCharacter(overrides: Partial<ApiCharacter> = {}): ApiCharacter {
  return {
    id: 1,
    name: 'Goku',
    image: 'goku.webp',
    race: 'Saiyan',
    gender: 'Male',
    affiliation: 'Z Fighter',
    ki: '60.000.000',
    maxKi: '90 Septillion',
    description: 'El protagonista de la serie.',
    originPlanet: { name: 'Tierra', isDestroyed: false, image: 'tierra.webp' },
    transformations: [{ id: 1, name: 'Goku SSJ', image: 'ssj.webp', ki: '3 Billion' }],
    ...overrides,
  }
}

export function buildCharacterCard(overrides: Partial<CharacterCard> = {}): CharacterCard {
  return {
    id: 1,
    name: 'Goku',
    imageUrl: 'goku.webp',
    race: 'Saiyan',
    affiliation: 'Z Fighter',
    ...overrides,
  }
}

export function buildCharacterDetail(overrides: Partial<CharacterDetail> = {}): CharacterDetail {
  return {
    name: 'Goku',
    imageUrl: 'goku.webp',
    description: 'El protagonista de la serie.',
    race: 'Saiyan',
    gender: 'Male',
    affiliation: 'Z Fighter',
    kiLabel: 'Ki 60.000.000',
    maxKiLabel: 'Max ki 90 Septillion',
    originPlanet: { name: 'Tierra', statusLabel: 'Intact', imageUrl: 'tierra.webp' },
    transformations: [],
    ...overrides,
  }
}
