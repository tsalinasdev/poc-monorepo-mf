import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'
import { createHostFederationConfig } from './module-federation.config.ts'

const DEV_ENTRIES = {
  // With the move to manifest-based loading (ADR 0005), the dev entries point
  // to each remote's mf-manifest.json — the plugin emits it next to remoteEntry.js
  // when `manifest: true` is set in module-federation.config.ts.
  remotePokemon: 'http://localhost:5174/mf-manifest.json',
  remoteDragonball: 'http://localhost:5175/mf-manifest.json',
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
                remotePokemon: env.VITE_REMOTE_POKEMON_MANIFEST_URL || DEV_ENTRIES.remotePokemon,
                remoteDragonball:
                  env.VITE_REMOTE_DRAGONBALL_MANIFEST_URL || DEV_ENTRIES.remoteDragonball,
              }),
            ),
          ]),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      // When remotes run inside the host their API calls hit the host's origin,
      // so the host must proxy them — the remote's own dev-server proxy is only
      // active when that remote runs standalone.
      proxy: {
        '/api/pokeapi': {
          target: 'https://pokeapi.co',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/pokeapi/, '/api/v2'),
        },
        '/api/dragonball': {
          target: 'https://dragonball-api.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/dragonball/, '/api'),
        },
      },
    },
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
        'remotePokemon/export-app': fileURLToPath(
          new URL('./tests/stubs/remote-pokemon-export-app.ts', import.meta.url),
        ),
        'remoteDragonball/export-app': fileURLToPath(
          new URL('./tests/stubs/remote-dragonball-export-app.ts', import.meta.url),
        ),
      },
    },
  }
})
