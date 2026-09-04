import { UseCase } from '@/base/lib/application/use-case.base'
import type { Result } from '@/base/lib/domain/result'
import type { Paginated } from '@/base/lib/domain/paginated'
import type { CharacterSummary } from '../../../domain/entities/character-summary.entity'
import type { FindCharactersProps } from '../../../domain/props/find-characters.props'
import type { CharacterRepository } from '../../../domain/ports/character.repository'

export class CharactersFinder extends UseCase<FindCharactersProps, Paginated<CharacterSummary>> {
  constructor(private readonly characterRepository: CharacterRepository) {
    super()
  }

  async execute(props: FindCharactersProps): Promise<Result<Paginated<CharacterSummary>>> {
    return this.characterRepository.findAll(props)
  }
}
