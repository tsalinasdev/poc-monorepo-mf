import { computed } from 'vue'
import { useQuery } from '@pinia/colada'
import { NotFoundError } from '@/modules/shared/api/http'
import { getCharacter } from '../services/characters.services'

const NOT_FOUND_MESSAGE = 'That character does not exist in the archive'
const UNREACHABLE_MESSAGE = 'The Dragon Ball archive is unreachable right now, please try again'

function toUiMessage(error: unknown): string {
  return error instanceof NotFoundError ? NOT_FOUND_MESSAGE : UNREACHABLE_MESSAGE
}

export function useCharacter(id: number) {
  const { data, error, isPending } = useQuery({
    key: ['character', 'detail', id],
    query: () => getCharacter(id),
  })

  const detail = computed(() => data.value ?? null)
  const uiError = computed(() => (error.value ? toUiMessage(error.value) : null))

  return { detail, isLoading: isPending, error: uiError }
}
