import { flushPromises } from '@vue/test-utils'
import { asValue } from 'awilix'
import { container } from '@/base/config/di/container'
import { Result } from '@/base/lib/domain/result'
import { Paginated } from '@/base/lib/domain/paginated'
import { HttpServiceException } from '@/base/config/http/exception/http-service.exception'
import type { CharactersFinder } from '@/modules/character/application/use-cases/characters-finder/characters-finder.use-case'
import { useCharacterListViewModel } from '@/modules/character/presentation/screens/character-list/useCharacterListViewModel'
import { buildCharacterSummary } from '../../../builders/character.builder'
import { withSetup } from '../../../../../helpers/with-setup'

const execute = vi.fn()

beforeEach(() => {
  execute.mockReset()
  container.register({ charactersFinder: asValue({ execute } as unknown as CharactersFinder) })
})

it('exposes character cards when the use case succeeds', async () => {
  execute.mockResolvedValue(
    Result.ok(new Paginated([buildCharacterSummary({ name: 'Goku' })], 58, 1, 20)),
  )

  const { result, app } = withSetup(() => useCharacterListViewModel())
  await flushPromises()

  expect(result.cards.value).toHaveLength(1)
  expect(result.cards.value[0]?.name).toBe('Goku')
  expect(result.totalPages.value).toBe(3)
  expect(result.error.value).toBeNull()
  app.unmount()
})

it('maps the DomainException code to a UI message on failure', async () => {
  execute.mockResolvedValue(Result.err(new HttpServiceException(500, 'Internal error')))

  const { result, app } = withSetup(() => useCharacterListViewModel())
  await flushPromises()

  expect(result.error.value).toBe(
    'The Dragon Ball archive is unreachable right now, please try again',
  )
  expect(result.cards.value).toHaveLength(0)
  app.unmount()
})
