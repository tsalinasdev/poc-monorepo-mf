import { CharactersFinder } from '@/modules/character/application/use-cases/characters-finder/characters-finder.use-case'
import { FindCharactersProps } from '@/modules/character/domain/props/find-characters.props'
import type { CharacterRepository } from '@/modules/character/domain/ports/character.repository'
import { Result } from '@/base/lib/domain/result'
import { Paginated } from '@/base/lib/domain/paginated'
import { HttpServiceException } from '@/base/config/http/exception/http-service.exception'
import { buildCharacterSummary } from '../../../builders/character.builder'

const findAll = vi.fn()
const findById = vi.fn()
const characterRepository: CharacterRepository = { findAll, findById }
const useCase = new CharactersFinder(characterRepository)

beforeEach(() => {
  findAll.mockReset()
})

it('returns the paginated characters the repository resolved', async () => {
  findAll.mockResolvedValue(
    Result.ok(new Paginated([buildCharacterSummary({ name: 'Goku' })], 58, 1, 20)),
  )

  const result = await useCase.execute(new FindCharactersProps(1, 20))

  expect(result.isOk()).toBe(true)
  expect(result.getValue().items).toHaveLength(1)
  expect(result.getValue().total).toBe(58)
})

it('propagates the domain error the repository returned', async () => {
  findAll.mockResolvedValue(Result.err(new HttpServiceException(500, 'Internal error')))

  const result = await useCase.execute(new FindCharactersProps(1, 20))

  expect(result.isErr()).toBe(true)
  expect(result.getError().code).toBe('HTTP_SERVICE_ERROR')
})
