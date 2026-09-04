// The ViewModel is the only file in this screen that knows @pinia/colada exists.
// It is the driving boundary of the frontend hexagon: it unwraps the use case's
// Result, throws into the query engine, and exposes only presentation data.
import { computed } from 'vue'
import { useQuery } from '@pinia/colada'
import { container } from '@/base/config/di/container'
import type { DomainException } from '@/base/lib/domain/domain-exception.base'
import { FindPokemonProps } from '../../../domain/props/find-pokemon.props'
import { PokemonDetailScreenMapper } from '../../mappers/pokemon-detail-screen.mapper'

// Only the codes this screen can produce. Swap literals for i18n keys when needed.
const ERROR_MESSAGES: Record<string, string> = {
  POKEMON_NOT_FOUND: 'Pokémon not found — check the name and try again',
  HTTP_SERVICE_ERROR: 'The Pokédex is unreachable right now, please try again',
}

function toUiError(error: DomainException): string {
  return ERROR_MESSAGES[error.code] ?? 'Something went wrong, please try again'
}

export function usePokemonDetailViewModel(name: string) {
  const pokemonFinder = container.resolve('pokemonFinder')

  const { data, error, isPending } = useQuery({
    key: ['pokemon', 'detail', name],
    query: async () => {
      const result = await pokemonFinder.execute(new FindPokemonProps(name))
      if (result.isErr()) throw result.getError() // driving boundary: the only throw in the frontend
      return result.getValue() // Pokemon — the cache stores domain data
    },
  })

  const detail = computed(() =>
    data.value ? PokemonDetailScreenMapper.pokemonDomainToPokemonDetailModel(data.value) : null,
  )
  const uiError = computed(() => (error.value ? toUiError(error.value as DomainException) : null))

  return { detail, isLoading: isPending, error: uiError }
}
