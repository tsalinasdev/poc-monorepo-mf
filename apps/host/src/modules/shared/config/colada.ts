import type { PiniaColadaOptions } from '@pinia/colada'

// Technical caching policy, not per-screen: a query is considered fresh for
// 1 minute — revisiting a cached page/pokemon within that window renders
// instantly without refetching. Duplicated in the remotes on purpose: in
// standalone mode each remote installs its own plugin with these options.
export const coladaOptions: PiniaColadaOptions = {
  queryOptions: {
    staleTime: 60_000,
  },
}
