import { z } from 'zod'

// Where each remote publishes its entry: localhost in dev, the bucket/CDN URL
// in production. Consumed by vite.config.ts (build time) and validated here so
// a bad value fails at boot with a readable message.
export const envSchema = z.object({
  VITE_REMOTE_POKEMON_ENTRY: z.url(),
  VITE_REMOTE_DRAGONBALL_ENTRY: z.url(),
})

export type Env = z.infer<typeof envSchema>
