import { computed, ref } from 'vue'
import { useQuery } from '@pinia/colada'
import { DEFAULT_PAGE_SIZE } from '@/modules/shared/config/constants'
import { getPokemons } from '../services/pokemons.services'

const UNREACHABLE_MESSAGE = 'The Pokédex is unreachable right now, please try again'

export function usePokemons() {
  const page = ref(1)

  const { data, error, isPending } = useQuery({
    key: () => ['pokemon', 'list', page.value],
    query: () => getPokemons(page.value, DEFAULT_PAGE_SIZE),
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
