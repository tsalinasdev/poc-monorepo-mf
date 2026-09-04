import { Result } from '@/base/lib/domain/result'
import { Paginated } from '@/base/lib/domain/paginated'
import type { AxiosHttpClient } from '@/base/config/http/axios.http-client'
import type { HttpServiceException } from '@/base/config/http/exception/http-service.exception'
import type { CharacterRepository } from '../../domain/ports/character.repository'
import type { FindCharactersProps } from '../../domain/props/find-characters.props'
import type { FindCharacterProps } from '../../domain/props/find-character.props'
import type { CharacterSummary } from '../../domain/entities/character-summary.entity'
import type { Character } from '../../domain/entities/character.entity'
import { CharacterNotFoundException } from '../../domain/exceptions/character-not-found.exception'
import type { CharacterListResponseDto } from '../dtos/character-list-response.dto'
import type { CharacterResponseDto } from '../dtos/character-response.dto'
import { CharacterMapper } from '../mappers/character.mapper'

// The API answers an unknown character with 400 "Character ID not found"
// instead of a 404. Normalising that quirk into a domain exception is exactly
// the adapter's job — nothing above this layer should ever learn about it.
const NOT_FOUND_STATUS = 400
const NOT_FOUND_MESSAGE = 'Character ID not found'

export class HttpCharacterRepository implements CharacterRepository {
  constructor(private readonly httpClient: AxiosHttpClient) {}

  async findAll(props: FindCharactersProps): Promise<Result<Paginated<CharacterSummary>>> {
    try {
      const response = await this.httpClient.get<CharacterListResponseDto>(
        `/characters?page=${props.page}&limit=${props.limit}`,
      )
      const items = response.data.items.map(CharacterMapper.toSummary)
      return Result.ok(new Paginated(items, response.data.meta.totalItems, props.page, props.limit))
    } catch (error) {
      return Result.err(error as HttpServiceException) // extends DomainException — generic fallback
    }
  }

  async findById(props: FindCharacterProps): Promise<Result<Character>> {
    try {
      const response = await this.httpClient.get<CharacterResponseDto>(`/characters/${props.id}`)
      return Result.ok(CharacterMapper.toDomain(response.data))
    } catch (error) {
      const httpError = error as HttpServiceException
      if (this.isNotFound(httpError)) {
        return Result.err(new CharacterNotFoundException(props.id))
      }
      return Result.err(httpError) // extends DomainException — generic fallback
    }
  }

  private isNotFound(error: HttpServiceException): boolean {
    return error.statusCode === NOT_FOUND_STATUS && error.message.includes(NOT_FOUND_MESSAGE)
  }
}
