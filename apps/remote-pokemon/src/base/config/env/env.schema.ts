import { z } from 'zod'

// Either an absolute URL (production) or a path that starts with "/" (dev,
// where the Vite proxy in vite.config.ts forwards `/api/pokeapi/*` to
// `https://pokeapi.co/api/v2/*`). The dev path exists so a corporate firewall
// (Cato) or a missing CORS header from PokeAPI don't break local dev — see
// ADR 0005 for the contract and R17 for the cache/CORS rationale.
export const envSchema = z.object({
  VITE_API_BASE_URL: z.union([z.url(), z.string().regex(/^\//)]),
})

export type Env = z.infer<typeof envSchema>
