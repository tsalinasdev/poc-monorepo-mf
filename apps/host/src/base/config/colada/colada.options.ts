import type { PiniaColadaOptions } from '@pinia/colada'

// Technical caching policy lives here (base), not per screen: a query is
// considered fresh for 1 minute — revisiting a cached page/pokemon within
// that window renders instantly without refetching.
export const coladaOptions: PiniaColadaOptions = {
  queryOptions: {
    staleTime: 60_000,
  },
}
