import { UseCase } from '@/base/lib/application/use-case.base'
import type { Result } from '@/base/lib/domain/result'
import type { Pokemon } from '../../../domain/entities/pokemon.entity'
import type { FindPokemonProps } from '../../../domain/props/find-pokemon.props'
import type { PokemonRepository } from '../../../domain/ports/pokemon.repository'

export class PokemonFinder extends UseCase<FindPokemonProps, Pokemon> {
  constructor(private readonly pokemonRepository: PokemonRepository) {
    super()
  }

  async execute(props: FindPokemonProps): Promise<Result<Pokemon>> {
    return this.pokemonRepository.findByName(props)
  }
}
