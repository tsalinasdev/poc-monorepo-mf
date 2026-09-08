import { flushPromises } from '@vue/test-utils'
import { vi } from 'vitest'
import { ApiError } from '@/modules/shared/api/http'
import type { CharacterListPage } from '@/modules/character/services/characters.services'
import { useCharacters } from '@/modules/character/composables/useCharacters'
import { buildCharacterCard } from '../builders/character.builders'
import { withSetup } from '../../../helpers/with-setup'

vi.mock('@/modules/character/services/characters.services', () => ({
  getCharacters: vi.fn(),
}))

const getCharacters = vi.mocked(
  (await import('@/modules/character/services/characters.services')).getCharacters,
)

beforeEach(() => {
  getCharacters.mockReset()
})

it('exposes character cards when the service succeeds', async () => {
  const listPage: CharacterListPage = { items: [buildCharacterCard({ name: 'Goku' })], total: 58 }
  getCharacters.mockResolvedValue(listPage)

  const { result, app } = withSetup(() => useCharacters())
  await flushPromises()

  expect(result.cards.value).toHaveLength(1)
  expect(result.cards.value[0]?.name).toBe('Goku')
  expect(result.totalPages.value).toBe(3)
  expect(result.error.value).toBeNull()
  app.unmount()
})

it('maps a service failure to a UI message', async () => {
  getCharacters.mockRejectedValue(new ApiError('Internal error', 500))

  const { result, app } = withSetup(() => useCharacters())
  await flushPromises()

  expect(result.error.value).toBe(
    'The Dragon Ball archive is unreachable right now, please try again',
  )
  expect(result.cards.value).toHaveLength(0)
  app.unmount()
})
