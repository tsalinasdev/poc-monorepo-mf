import { DomainException } from '@/base/lib/domain/domain-exception.base'

export class CharacterNotFoundException extends DomainException {
  readonly code = 'CHARACTER_NOT_FOUND'

  constructor(id: number) {
    super(`Character ${id} not found`)
  }
}
