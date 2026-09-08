import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'
import mfConfig from './module-federation.config.ts'

const DEV_ORIGIN = 'http://localhost:5175'

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
    // CORS must stay open: the host fetches remoteEntry.js cross-origin.
    server: {
      port: 5175,
      strictPort: true,
      origin: DEV_ORIGIN,
      cors: true,
      // Dev-only proxy to the Dragon Ball API. The browser blocks cross-origin
      // XHR when the upstream doesn't return permissive CORS headers (or when
      // a corporate firewall strips them); routing through Vite removes the
      // cross-origin. `.env.development` points `VITE_API_BASE_URL` at this
      // proxy path; `.env` keeps the real upstream URL for production
      // builds.
      proxy: {
        '/api/dragonball': {
          target: 'https://dragonball-api.com',
          changeOrigin: true,
          secure: false, // dev-only: the corporate proxy re-signs TLS with its own CA
          rewrite: (path) => path.replace(/^\/api\/dragonball/, '/api'),
        },
      },
    },
    preview: { port: 5175, strictPort: true, cors: true },
    build: { target: 'chrome89' },
    test: {
      environment: 'jsdom',
      globals: true,
      root: '.',
      include: ['src/__test__/**/*.spec.ts'],
    },
  }
})
