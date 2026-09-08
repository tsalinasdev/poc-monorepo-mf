import { computed } from 'vue'
import { useQuery } from '@pinia/colada'
import { NotFoundError } from '@/modules/shared/api/http'
import { getPokemon } from '../services/pokemons.services'

const NOT_FOUND_MESSAGE = 'Pokémon not found — check the name and try again'
const UNREACHABLE_MESSAGE = 'The Pokédex is unreachable right now, please try again'

function toUiMessage(error: unknown): string {
  return error instanceof NotFoundError ? NOT_FOUND_MESSAGE : UNREACHABLE_MESSAGE
}

export function usePokemon(name: string) {
  const { data, error, isPending } = useQuery({
    key: ['pokemon', 'detail', name],
    query: () => getPokemon(name),
  })

  const detail = computed(() => data.value ?? null)
  const uiError = computed(() => (error.value ? toUiMessage(error.value) : null))

  return { detail, isLoading: isPending, error: uiError }
}
