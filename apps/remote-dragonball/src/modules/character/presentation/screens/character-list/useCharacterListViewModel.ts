// The ViewModel is the only file in this screen that knows @pinia/colada exists.
// It is the driving boundary of the frontend hexagon: it unwraps the use case's
// Result, throws into the query engine, and exposes only presentation data.
import { computed, ref } from 'vue'
import { useQuery } from '@pinia/colada'
import { container } from '@/base/config/di/container'
import type { DomainException } from '@/base/lib/domain/domain-exception.base'
import { DEFAULT_PAGE_SIZE } from '@/base/constants'
import { FindCharactersProps } from '../../../domain/props/find-characters.props'
import { CharacterListScreenMapper } from '../../mappers/character-list-screen.mapper'

// Only the codes this screen can produce. Swap literals for i18n keys when needed.
const ERROR_MESSAGES: Record<string, string> = {
  HTTP_SERVICE_ERROR: 'The Dragon Ball archive is unreachable right now, please try again',
}

function toUiError(error: DomainException): string {
  return ERROR_MESSAGES[error.code] ?? 'Something went wrong, please try again'
}

export function useCharacterListViewModel() {
  const charactersFinder = container.resolve('charactersFinder')
  const page = ref(1)

  const { data, error, isPending } = useQuery({
    key: () => ['character', 'list', page.value],
    query: async () => {
      const result = await charactersFinder.execute(
        new FindCharactersProps(page.value, DEFAULT_PAGE_SIZE),
      )
      if (result.isErr()) throw result.getError() // driving boundary: the only throw in the frontend
      return result.getValue() // Paginated<CharacterSummary> — the cache stores domain data
    },
  })

  const cards = computed(() =>
    (data.value?.items ?? []).map(
      CharacterListScreenMapper.characterSummaryDomainToCharacterCardModel,
    ),
  )
  const totalPages = computed(() =>
    data.value ? Math.ceil(data.value.total / data.value.limit) : 0,
  )
  const uiError = computed(() => (error.value ? toUiError(error.value as DomainException) : null))

  function nextPage() {
    if (totalPages.value === 0 || page.value < totalPages.value) page.value += 1
  }

  function prevPage() {
    if (page.value > 1) page.value -= 1
  }

  return { cards, page, totalPages, isLoading: isPending, error: uiError, nextPage, prevPage }
}
