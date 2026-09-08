import { ApiError, httpGet, NotFoundError } from '@/modules/shared/api/http'
import type { CharacterCard, CharacterDetail } from '../models/character.model'

// Subset of the Dragon Ball API — only the fields this app consumes.
export interface ApiCharacterItem {
  id: number
  name: string
  image: string
  race: string | null
  affiliation: string | null
}

export interface ApiCharacterList {
  items: ApiCharacterItem[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}

interface ApiOriginPlanet {
  name: string
  isDestroyed: boolean
  image: string
}

interface ApiTransformation {
  id: number
  name: string
  image: string
  ki: string | null
}

export interface ApiCharacter {
  id: number
  name: string
  image: string
  race: string | null
  gender: string | null
  affiliation: string | null
  ki: string | null
  maxKi: string | null
  description: string
  originPlanet?: ApiOriginPlanet | null
  transformations?: ApiTransformation[]
}

export interface CharacterListPage {
  items: CharacterCard[]
  total: number
}

// The API returns null for several optional fields; the UI does not model
// absence for them, so the mapping is where nulls become explicit fallbacks.
const UNKNOWN = 'Unknown'

// The API answers an unknown character with 400 "Character ID not found"
// instead of a 404. Normalising that quirk here means the UI only ever has to
// recognise a NotFoundError.
const NOT_FOUND_MESSAGE = 'Character ID not found'

function isNotFound(error: ApiError): boolean {
  return error.status === 404 || (error.status === 400 && error.message.includes(NOT_FOUND_MESSAGE))
}

function toDetail(raw: ApiCharacter): CharacterDetail {
  return {
    name: raw.name,
    imageUrl: raw.image,
    description: raw.description,
    race: raw.race ?? UNKNOWN,
    gender: raw.gender ?? UNKNOWN,
    affiliation: raw.affiliation ?? UNKNOWN,
    kiLabel: `Ki ${raw.ki ?? UNKNOWN}`,
    maxKiLabel: `Max ki ${raw.maxKi ?? UNKNOWN}`,
    originPlanet: raw.originPlanet
      ? {
          name: raw.originPlanet.name,
          statusLabel: raw.originPlanet.isDestroyed ? 'Destroyed' : 'Intact',
          imageUrl: raw.originPlanet.image,
        }
      : null,
    transformations: (raw.transformations ?? []).map((transformation) => ({
      id: transformation.id,
      name: transformation.name,
      imageUrl: transformation.image,
      kiLabel: `Ki ${transformation.ki ?? UNKNOWN}`,
    })),
  }
}

export async function getCharacters(page: number, limit: number): Promise<CharacterListPage> {
  const data = await httpGet<ApiCharacterList>(`/characters?page=${page}&limit=${limit}`)
  return {
    items: data.items.map((item) => ({
      id: item.id,
      name: item.name,
      imageUrl: item.image,
      race: item.race ?? UNKNOWN,
      affiliation: item.affiliation ?? UNKNOWN,
    })),
    total: data.meta.totalItems,
  }
}

export async function getCharacter(id: number): Promise<CharacterDetail> {
  try {
    const raw = await httpGet<ApiCharacter>(`/characters/${id}`)
    return toDetail(raw)
  } catch (error) {
    if (error instanceof ApiError && isNotFound(error)) {
      throw new NotFoundError(`Character ${id} not found`)
    }
    throw error
  }
}
