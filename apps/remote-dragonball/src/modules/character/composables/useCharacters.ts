import { computed, ref } from 'vue'
import { useQuery } from '@pinia/colada'
import { DEFAULT_PAGE_SIZE } from '@/modules/shared/config/constants'
import { getCharacters } from '../services/characters.services'

const UNREACHABLE_MESSAGE = 'The Dragon Ball archive is unreachable right now, please try again'

export function useCharacters() {
  const page = ref(1)

  const { data, error, isPending } = useQuery({
    key: () => ['character', 'list', page.value],
    query: () => getCharacters(page.value, DEFAULT_PAGE_SIZE),
  })

  const cards = computed(() => data.value?.items ?? [])
  const totalPages = computed(() =>
    data.value ? Math.ceil(data.value.total / DEFAULT_PAGE_SIZE) : 0,
  )
  const uiError = computed(() => (error.value ? UNREACHABLE_MESSAGE : null))

  function nextPage() {
    if (totalPages.value === 0 || page.value < totalPages.value) page.value += 1
  }

  function prevPage() {
    if (page.value > 1) page.value -= 1
  }

  return { cards, page, totalPages, isLoading: isPending, error: uiError, nextPage, prevPage }
}
