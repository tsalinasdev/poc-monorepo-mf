import { z } from 'zod'

// Either an absolute URL (production) or a path that starts with "/" (dev,
// where the Vite proxy in vite.config.ts forwards `/api/dragonball/*` to
// `https://dragonball-api.com/api/*`). The dev path exists so a corporate
// firewall or a missing CORS header doesn't break local dev — see ADR 0005
// for the contract.
export const envSchema = z.object({
  VITE_API_BASE_URL: z.union([z.url(), z.string().regex(/^\//)]),
})

export type Env = z.infer<typeof envSchema>
