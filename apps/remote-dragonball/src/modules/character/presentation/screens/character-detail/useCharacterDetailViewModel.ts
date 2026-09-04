// The ViewModel is the only file in this screen that knows @pinia/colada exists.
// It is the driving boundary of the frontend hexagon: it unwraps the use case's
// Result, throws into the query engine, and exposes only presentation data.
import { computed } from 'vue'
import { useQuery } from '@pinia/colada'
import { container } from '@/base/config/di/container'
import type { DomainException } from '@/base/lib/domain/domain-exception.base'
import { FindCharacterProps } from '../../../domain/props/find-character.props'
import { CharacterDetailScreenMapper } from '../../mappers/character-detail-screen.mapper'

// Only the codes this screen can produce. Swap literals for i18n keys when needed.
const ERROR_MESSAGES: Record<string, string> = {
  CHARACTER_NOT_FOUND: 'That character does not exist in the archive',
  HTTP_SERVICE_ERROR: 'The Dragon Ball archive is unreachable right now, please try again',
}

function toUiError(error: DomainException): string {
  return ERROR_MESSAGES[error.code] ?? 'Something went wrong, please try again'
}

export function useCharacterDetailViewModel(id: number) {
  const characterFinder = container.resolve('characterFinder')

  const { data, error, isPending } = useQuery({
    key: ['character', 'detail', id],
    query: async () => {
      const result = await characterFinder.execute(new FindCharacterProps(id))
      if (result.isErr()) throw result.getError() // driving boundary: the only throw in the frontend
      return result.getValue() // Character — the cache stores domain data
    },
  })

  const detail = computed(() =>
    data.value
      ? CharacterDetailScreenMapper.characterDomainToCharacterDetailModel(data.value)
      : null,
  )
  const uiError = computed(() => (error.value ? toUiError(error.value as DomainException) : null))

  return { detail, isLoading: isPending, error: uiError }
}
