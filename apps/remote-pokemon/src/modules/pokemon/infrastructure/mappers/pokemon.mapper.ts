import { PokemonSummary } from '../../domain/entities/pokemon-summary.entity'
import { Pokemon } from '../../domain/entities/pokemon.entity'
import type { PokemonListItemDto } from '../dtos/pokemon-list-response.dto'
import type { PokemonResponseDto } from '../dtos/pokemon-response.dto'

const OFFICIAL_ARTWORK_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork'

export class PokemonMapper {
  static toSummary(item: PokemonListItemDto): PokemonSummary {
    const id = PokemonMapper.idFromUrl(item.url)
    return new PokemonSummary(id, item.name, `${OFFICIAL_ARTWORK_URL}/${id}.png`)
  }

  static toDomain(raw: PokemonResponseDto): Pokemon {
    const imageUrl =
      raw.sprites.other?.['official-artwork']?.front_default ??
      raw.sprites.front_default ??
      `${OFFICIAL_ARTWORK_URL}/${raw.id}.png`

    return new Pokemon(
      raw.id,
      raw.name,
      imageUrl,
      raw.height,
      raw.weight,
      raw.types.map((entry) => entry.type.name),
      raw.stats.map((entry) => ({ name: entry.stat.name, value: entry.base_stat })),
    )
  }

  private static idFromUrl(url: string): number {
    // PokeAPI resource URLs end with "/pokemon/{id}/"
    const segments = url.split('/').filter(Boolean)
    return Number(segments[segments.length - 1])
  }
}
