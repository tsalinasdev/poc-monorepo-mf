import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'
import { createHostFederationConfig } from './module-federation.config.ts'

const DEV_ENTRIES = {
  remotePokemon: 'http://localhost:5174/remoteEntry.js',
  remoteDragonball: 'http://localhost:5175/remoteEntry.js',
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Read here (Node side) to build the federation config; the same variables are
  // validated again at runtime in src/base/config/env so a missing/malformed
  // value fails fast with a readable error instead of a cryptic MF failure.
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [
      vue(),
      tailwindcss(),
      // The federation plugin rewrites imports of `remote*/…`; Vitest never
      // resolves a real remote, so it is left out of the test pipeline (tests
      // stub each contract instead — see tests/stubs).
      ...(mode === 'test'
        ? []
        : [
            federation(
              createHostFederationConfig({
                remotePokemon: env.VITE_REMOTE_POKEMON_ENTRY || DEV_ENTRIES.remotePokemon,
                remoteDragonball: env.VITE_REMOTE_DRAGONBALL_ENTRY || DEV_ENTRIES.remoteDragonball,
              }),
            ),
          ]),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: { port: 5173, strictPort: true },
    preview: { port: 5173, strictPort: true },
    // Module Federation emits ESM with top-level await; chrome89 is the baseline
    // the plugin documents for that output.
    build: { target: 'chrome89' },
    test: {
      environment: 'jsdom',
      globals: true,
      root: '.',
      include: ['tests/**/*.spec.ts'],
      alias: {
        // No remote is built during unit tests: the host is verified against
        // stubs of each federated contract.
        'remotePokemon/routes': fileURLToPath(
          new URL('./tests/stubs/remote-pokemon-routes.ts', import.meta.url),
        ),
        'remoteDragonball/routes': fileURLToPath(
          new URL('./tests/stubs/remote-dragonball-routes.ts', import.meta.url),
        ),
      },
    },
  }
})
