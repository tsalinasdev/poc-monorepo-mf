import { flushPromises } from '@vue/test-utils'
import { vi } from 'vitest'
import { NotFoundError } from '@/modules/shared/api/http'
import { useCharacter } from '@/modules/character/composables/useCharacter'
import { buildCharacterDetail } from '../builders/character.builders'
import { withSetup } from '../../../helpers/with-setup'

vi.mock('@/modules/character/services/characters.services', () => ({
  getCharacter: vi.fn(),
}))

const getCharacter = vi.mocked(
  (await import('@/modules/character/services/characters.services')).getCharacter,
)

beforeEach(() => {
  getCharacter.mockReset()
})

it('exposes the character detail when the service succeeds', async () => {
  getCharacter.mockResolvedValue(buildCharacterDetail())

  const { result, app } = withSetup(() => useCharacter(1))
  await flushPromises()

  expect(result.detail.value?.name).toBe('Goku')
  expect(result.error.value).toBeNull()
  app.unmount()
})

it('tells a missing character apart from an unreachable archive', async () => {
  getCharacter.mockRejectedValue(new NotFoundError('Character 999 not found'))

  const { result, app } = withSetup(() => useCharacter(999))
  await flushPromises()

  expect(result.error.value).toBe('That character does not exist in the archive')
  app.unmount()
})
