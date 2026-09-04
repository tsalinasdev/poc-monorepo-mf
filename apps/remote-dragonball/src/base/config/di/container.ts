import { createContainer, asFunction } from 'awilix'
import { AxiosHttpClient } from '@/base/config/http/axios.http-client'
import type { CharacterRepository } from '@/modules/character/domain/ports/character.repository'
import { HttpCharacterRepository } from '@/modules/character/infrastructure/repositories/http-character.repository'
import { CharactersFinder } from '@/modules/character/application/use-cases/characters-finder/characters-finder.use-case'
import { CharacterFinder } from '@/modules/character/application/use-cases/character-finder/character-finder.use-case'

// Typed cradle: container.resolve('name') returns the right type, and a typo
// in a registration name fails at compile time instead of at runtime.
export interface Cradle {
  httpClient: AxiosHttpClient
  characterRepository: CharacterRepository
  charactersFinder: CharactersFinder
  characterFinder: CharacterFinder
}

export const container = createContainer<Cradle>()

/**
 * Every dependency is wired by hand instead of with `asClass` + CLASSIC mode.
 *
 * CLASSIC injection resolves dependencies by reading the CONSTRUCTOR PARAMETER
 * NAMES, which only survive in unminified code. In a production build the
 * minifier renames `characterRepository` to `e`, Awilix then looks for a
 * registration called `e`, and every screen dies with
 * "Could not resolve 'e'. Resolution path: charactersFinder -> e".
 * It passed dev forever because dev is never minified.
 *
 * Reading `cradle.characterRepository` is a property access, and minifiers do
 * not rename properties, so this wiring survives any build. It is also better
 * for a hexagon: the composition root is the single place that knows the object
 * graph, TypeScript checks each `new` call against its real constructor, and
 * the classes keep honest typed parameters instead of a magic cradle argument.
 */
container.register({
  // Base infrastructure
  httpClient: asFunction(() => new AxiosHttpClient()).singleton(),

  // Adapters
  characterRepository: asFunction(
    (cradle: Cradle) => new HttpCharacterRepository(cradle.httpClient),
  ).singleton(),

  // Use cases
  charactersFinder: asFunction(
    (cradle: Cradle) => new CharactersFinder(cradle.characterRepository),
  ).singleton(),
  characterFinder: asFunction(
    (cradle: Cradle) => new CharacterFinder(cradle.characterRepository),
  ).singleton(),
})
