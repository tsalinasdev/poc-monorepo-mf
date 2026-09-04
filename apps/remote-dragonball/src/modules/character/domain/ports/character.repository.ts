import type { Result } from '@/base/lib/domain/result'
import type { Paginated } from '@/base/lib/domain/paginated'
import type { CharacterSummary } from '../entities/character-summary.entity'
import type { Character } from '../entities/character.entity'
import type { FindCharactersProps } from '../props/find-characters.props'
import type { FindCharacterProps } from '../props/find-character.props'

export interface CharacterRepository {
  findAll(props: FindCharactersProps): Promise<Result<Paginated<CharacterSummary>>>
  findById(props: FindCharacterProps): Promise<Result<Character>>
}
