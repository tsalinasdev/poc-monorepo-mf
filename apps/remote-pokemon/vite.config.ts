import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'
import mfConfig from './module-federation.config.ts'

const DEV_ORIGIN = 'http://localhost:5174'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  // The host loads these chunks from a DIFFERENT origin, so every asset URL has
  // to be absolute — a relative path would resolve against the host and 404.
  // In production set VITE_PUBLIC_PATH to the bucket/CDN URL of this build.
  const publicPath = env.VITE_PUBLIC_PATH || `${DEV_ORIGIN}/`

  return {
    base: publicPath,
    plugins: [
      vue(),
      tailwindcss(),
      // Left out under Vitest: tests exercise the app directly, and the
      // plugin's remote-entry rewriting has no meaning outside a real build.
      ...(mode === 'test' ? [] : [federation(mfConfig)]),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    // The dev-mode `VITE_API_BASE_URL` is supplied via `.env.development`
    // (the proxy URL `/api/pokeapi` is not a valid absolute URL for the env
    // schema, and `.env` is reserved for the production value that ships
    // in builds). Vite loads `.env.<mode>` automatically when `mode === 'development'`.
    // CORS must stay open: the host fetches remoteEntry.js cross-origin.
    server: {
      port: 5174,
      strictPort: true,
      origin: DEV_ORIGIN,
      cors: true,
      // Dev-only proxy to PokeAPI. The browser blocks cross-origin XHR when
      // PokeAPI doesn't return permissive CORS headers (or when a corporate
      // firewall strips them — Cato, lookin' at you); routing through Vite
      // removes the cross-origin and the dependency on the network's posture.
      // Build/preview don't apply: production hits PokeAPI directly with the
      // `VITE_API_BASE_URL` the deployment pipeline sets.
      proxy: {
        '/api/pokeapi': {
          target: 'https://pokeapi.co',
          changeOrigin: true,
          secure: false, // dev-only: the corporate proxy re-signs TLS with its own CA
          rewrite: (path) => path.replace(/^\/api\/pokeapi/, '/api/v2'),
        },
      },
    },
    preview: { port: 5174, strictPort: true, cors: true },
    build: { target: 'chrome89' },
    test: {
      environment: 'jsdom',
      globals: true,
      root: '.',
      include: ['src/__test__/**/*.spec.ts'],
    },
  }
})
