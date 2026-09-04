import { createContainer, asFunction } from 'awilix'
import { AxiosHttpClient } from '@/base/config/http/axios.http-client'
import type { PokemonRepository } from '@/modules/pokemon/domain/ports/pokemon.repository'
import { HttpPokemonRepository } from '@/modules/pokemon/infrastructure/repositories/http-pokemon.repository'
import { PokemonsFinder } from '@/modules/pokemon/application/use-cases/pokemons-finder/pokemons-finder.use-case'
import { PokemonFinder } from '@/modules/pokemon/application/use-cases/pokemon-finder/pokemon-finder.use-case'

// Typed cradle: container.resolve('name') returns the right type, and a typo
// in a registration name fails at compile time instead of at runtime.
export interface Cradle {
  httpClient: AxiosHttpClient
  pokemonRepository: PokemonRepository
  pokemonsFinder: PokemonsFinder
  pokemonFinder: PokemonFinder
}

export const container = createContainer<Cradle>()

/**
 * Every dependency is wired by hand instead of with `asClass` + CLASSIC mode.
 *
 * CLASSIC injection resolves dependencies by reading the CONSTRUCTOR PARAMETER
 * NAMES, which only survive in unminified code. In a production build the
 * minifier renames `pokemonRepository` to `e`, Awilix then looks for a
 * registration called `e`, and every screen dies with
 * "Could not resolve 'e'. Resolution path: pokemonsFinder -> e".
 * It passed dev forever because dev is never minified.
 *
 * Reading `cradle.pokemonRepository` is a property access, and minifiers do not
 * rename properties, so this wiring survives any build. It is also better for a
 * hexagon: the composition root is the single place that knows the object
 * graph, TypeScript checks each `new` call against its real constructor, and
 * the classes keep honest typed parameters instead of a magic cradle argument.
 */
container.register({
  // Base infrastructure
  httpClient: asFunction(() => new AxiosHttpClient()).singleton(),

  // Adapters
  pokemonRepository: asFunction(
    (cradle: Cradle) => new HttpPokemonRepository(cradle.httpClient),
  ).singleton(),

  // Use cases
  pokemonsFinder: asFunction(
    (cradle: Cradle) => new PokemonsFinder(cradle.pokemonRepository),
  ).singleton(),
  pokemonFinder: asFunction(
    (cradle: Cradle) => new PokemonFinder(cradle.pokemonRepository),
  ).singleton(),
})
