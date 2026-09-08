import { z } from 'zod'

// Either an absolute URL (production) or a path that starts with "/" (dev,
// where the Vite proxy in vite.config.ts forwards `/api/dragonball/*` to
// `https://dragonball-api.com/api/*`). The dev path exists so a corporate
// firewall or a missing CORS header doesn't break local dev.
export const envSchema = z.object({
  VITE_API_BASE_URL: z.union([z.url(), z.string().regex(/^\//)]),
})

export type Env = z.infer<typeof envSchema>

const result = envSchema.safeParse(import.meta.env)

if (!result.success) {
  throw new Error(`Invalid environment variables:\n${result.error.toString()}`)
}

export const env = result.data
