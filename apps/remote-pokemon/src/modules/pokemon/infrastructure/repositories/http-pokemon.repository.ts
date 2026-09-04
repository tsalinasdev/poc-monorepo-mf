import { Result } from '@/base/lib/domain/result'
import { Paginated } from '@/base/lib/domain/paginated'
import type { AxiosHttpClient } from '@/base/config/http/axios.http-client'
import type { HttpServiceException } from '@/base/config/http/exception/http-service.exception'
import type { PokemonRepository } from '../../domain/ports/pokemon.repository'
import type { FindPokemonsProps } from '../../domain/props/find-pokemons.props'
import type { FindPokemonProps } from '../../domain/props/find-pokemon.props'
import type { PokemonSummary } from '../../domain/entities/pokemon-summary.entity'
import type { Pokemon } from '../../domain/entities/pokemon.entity'
import { PokemonNotFoundException } from '../../domain/exceptions/pokemon-not-found.exception'
import type { PokemonListResponseDto } from '../dtos/pokemon-list-response.dto'
import type { PokemonResponseDto } from '../dtos/pokemon-response.dto'
import { PokemonMapper } from '../mappers/pokemon.mapper'

export class HttpPokemonRepository implements PokemonRepository {
  constructor(private readonly httpClient: AxiosHttpClient) {}

  async findAll(props: FindPokemonsProps): Promise<Result<Paginated<PokemonSummary>>> {
    try {
      const offset = (props.page - 1) * props.limit
      const response = await this.httpClient.get<PokemonListResponseDto>(
        `/pokemon?limit=${props.limit}&offset=${offset}`,
      )
      const items = response.data.results.map(PokemonMapper.toSummary)
      return Result.ok(new Paginated(items, response.data.count, props.page, props.limit))
    } catch (error) {
      return Result.err(error as HttpServiceException) // extends DomainException — generic fallback
    }
  }

  async findByName(props: FindPokemonProps): Promise<Result<Pokemon>> {
    try {
      const response = await this.httpClient.get<PokemonResponseDto>(`/pokemon/${props.name}`)
      return Result.ok(PokemonMapper.toDomain(response.data))
    } catch (error) {
      const httpError = error as HttpServiceException
      if (httpError.statusCode === 404) return Result.err(new PokemonNotFoundException(props.name))
      return Result.err(httpError) // extends DomainException — generic fallback
    }
  }
}
