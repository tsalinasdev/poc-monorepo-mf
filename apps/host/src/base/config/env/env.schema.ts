import { z } from 'zod'

// Where each remote publishes its **manifest** (mf-manifest.json): localhost in
// dev, the bucket/CDN URL in production. Consumed by vite.config.ts (build time)
// and validated here so a bad value fails at boot with a readable message.
// The runtime then fetches the manifest first and loads only the exposes it
// needs — see ADR 0005.
export const envSchema = z.object({
  VITE_REMOTE_POKEMON_MANIFEST_URL: z.url(),
  VITE_REMOTE_DRAGONBALL_MANIFEST_URL: z.url(),
})

export type Env = z.infer<typeof envSchema>
