import type { Result } from '@/base/lib/domain/result'
import type { Paginated } from '@/base/lib/domain/paginated'
import type { PokemonSummary } from '../entities/pokemon-summary.entity'
import type { Pokemon } from '../entities/pokemon.entity'
import type { FindPokemonsProps } from '../props/find-pokemons.props'
import type { FindPokemonProps } from '../props/find-pokemon.props'

export interface PokemonRepository {
  findAll(props: FindPokemonsProps): Promise<Result<Paginated<PokemonSummary>>>
  findByName(props: FindPokemonProps): Promise<Result<Pokemon>>
}
