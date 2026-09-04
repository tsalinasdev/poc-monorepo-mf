import { DomainException } from '@/base/lib/domain/domain-exception.base'

export class PokemonNotFoundException extends DomainException {
  readonly code = 'POKEMON_NOT_FOUND'

  constructor(name: string) {
    super(`Pokemon ${name} not found`)
  }
}
