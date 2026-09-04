import type { PiniaColadaOptions } from '@pinia/colada'

// Technical caching policy: a query is fresh for 1 minute, so revisiting a
// cached page/pokemon within that window renders instantly without refetching.
//
// Duplicated in the host on purpose: under federation the HOST installs the
// plugin (one app instance, one cache) and its options win. This copy only
// serves `npm run dev` in standalone mode.
export const coladaOptions: PiniaColadaOptions = {
  queryOptions: {
    staleTime: 60_000,
  },
}
