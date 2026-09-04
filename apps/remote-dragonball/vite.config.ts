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
      // Left out under Vitest: tests exercise the hexagon directly, and the
      // plugin's remote-entry rewriting has no meaning outside a real build.
      ...(mode === 'test' ? [] : [federation(mfConfig)]),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    // CORS must stay open: the host fetches remoteEntry.js cross-origin.
    server: { port: 5175, strictPort: true, origin: DEV_ORIGIN, cors: true },
    preview: { port: 5175, strictPort: true, cors: true },
    build: { target: 'chrome89' },
    test: {
      environment: 'jsdom',
      globals: true,
      root: '.',
      include: ['tests/**/*.spec.ts'],
    },
  }
})
