import { UseCase } from '@/base/lib/application/use-case.base'
import type { Result } from '@/base/lib/domain/result'
import type { Character } from '../../../domain/entities/character.entity'
import type { FindCharacterProps } from '../../../domain/props/find-character.props'
import type { CharacterRepository } from '../../../domain/ports/character.repository'

export class CharacterFinder extends UseCase<FindCharacterProps, Character> {
  constructor(private readonly characterRepository: CharacterRepository) {
    super()
  }

  async execute(props: FindCharacterProps): Promise<Result<Character>> {
    return this.characterRepository.findById(props)
  }
}
