/**
 * Type surface of every federated module the host consumes.
 *
 * This is the ONLY place the host knows anything about a remote, and it is
 * deliberately narrow: a list of routes. No domain entity, use case, port or
 * adapter type crosses this line — each remote's hexagon stays inside it.
 */
declare module 'remotePokemon/routes' {
  import type { RouteRecordRaw } from 'vue-router'

  export const pokemonRoutes: RouteRecordRaw[]
}

declare module 'remoteDragonball/routes' {
  import type { RouteRecordRaw } from 'vue-router'

  export const characterRoutes: RouteRecordRaw[]
}
