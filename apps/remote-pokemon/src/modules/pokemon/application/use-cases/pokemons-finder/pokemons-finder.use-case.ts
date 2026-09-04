import { UseCase } from '@/base/lib/application/use-case.base'
import type { Result } from '@/base/lib/domain/result'
import type { Paginated } from '@/base/lib/domain/paginated'
import type { PokemonSummary } from '../../../domain/entities/pokemon-summary.entity'
import type { FindPokemonsProps } from '../../../domain/props/find-pokemons.props'
import type { PokemonRepository } from '../../../domain/ports/pokemon.repository'

export class PokemonsFinder extends UseCase<FindPokemonsProps, Paginated<PokemonSummary>> {
  constructor(private readonly pokemonRepository: PokemonRepository) {
    super()
  }

  async execute(props: FindPokemonsProps): Promise<Result<Paginated<PokemonSummary>>> {
    return this.pokemonRepository.findAll(props)
  }
}
