import { ApiError, httpGet, NotFoundError } from '@/modules/shared/api/http'
import type { PokemonCard, PokemonDetail } from '../models/pokemon.model'

// Subset of the PokeAPI — only the fields this app consumes.
export interface ApiPokemonListItem {
  name: string
  url: string
}

export interface ApiPokemonList {
  count: number
  results: ApiPokemonListItem[]
}

export interface ApiPokemon {
  id: number
  name: string
  height: number
  weight: number
  types: { slot: number; type: { name: string } }[]
  stats: { base_stat: number; stat: { name: string } }[]
  sprites: {
    front_default: string | null
    other?: { 'official-artwork'?: { front_default: string | null } }
  }
}

export interface PokemonListPage {
  items: PokemonCard[]
  total: number
}

// Sprites live in a separate repository from the API; the official artwork is
// derivable from the pokemon's id, which is also the fallback when a pokemon
// ships no sprite at all.
const OFFICIAL_ARTWORK_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork'

const MAX_BASE_STAT = 255

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

// PokeAPI resource URLs end with "/pokemon/{id}/".
function idFromUrl(url: string): number {
  const segments = url.split('/').filter(Boolean)
  return Number(segments[segments.length - 1])
}

function numberLabel(id: number): string {
  return `#${String(id).padStart(3, '0')}`
}

function toDetail(raw: ApiPokemon): PokemonDetail {
  const imageUrl =
    raw.sprites.other?.['official-artwork']?.front_default ??
    raw.sprites.front_default ??
    `${OFFICIAL_ARTWORK_URL}/${raw.id}.png`

  return {
    name: capitalize(raw.name),
    numberLabel: numberLabel(raw.id),
    imageUrl,
    heightLabel: `${(raw.height / 10).toFixed(1)} m`,
    weightLabel: `${(raw.weight / 10).toFixed(1)} kg`,
    types: raw.types.map((entry) => capitalize(entry.type.name)),
    stats: raw.stats.map((entry) => ({
      label: STAT_LABELS[entry.stat.name] ?? capitalize(entry.stat.name),
      value: entry.base_stat,
      percent: Math.round((entry.base_stat / MAX_BASE_STAT) * 100),
    })),
  }
}

export async function getPokemons(page: number, limit: number): Promise<PokemonListPage> {
  const offset = (page - 1) * limit
  const data = await httpGet<ApiPokemonList>(`/pokemon?limit=${limit}&offset=${offset}`)
  return {
    items: data.results.map((item) => {
      const id = idFromUrl(item.url)
      return {
        id,
        slug: item.name,
        name: capitalize(item.name),
        numberLabel: numberLabel(id),
        imageUrl: `${OFFICIAL_ARTWORK_URL}/${id}.png`,
      }
    }),
    total: data.count,
  }
}

export async function getPokemon(name: string): Promise<PokemonDetail> {
  try {
    const raw = await httpGet<ApiPokemon>(`/pokemon/${name}`)
    return toDetail(raw)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new NotFoundError(`Pokemon ${name} not found`)
    }
    throw error
  }
}
