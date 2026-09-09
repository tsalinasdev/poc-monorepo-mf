import { fileURLToPath, URL } from 'node:url'

import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { federation } from '@module-federation/vite'
import mfConfig from './module-federation.config.ts'

const DEV_ORIGIN = 'http://localhost:5176'

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
        // Mocks del módulo KPI (portados de kpi-project/api). Los servicios
        // los importan como módulos, no hay red real: no se necesita proxy.
        '@api': fileURLToPath(new URL('./api', import.meta.url)),
      },
    },
    server: {
      port: 5176,
      strictPort: true,
      origin: DEV_ORIGIN,
      cors: true,
    },
    preview: { port: 5176, strictPort: true, cors: true, headers: { 'Cache-Control': 'no-cache' } },
    // `mpa` (en vez del default `spa`) evita que vite preview haga fallback a
    // `index.html` para archivos reales del build como `mf-manifest.json` y
    // `remoteEntry.js` — sin esto, el host ve HTML al pedirlos y la
    // federación falla con "remote is unavailable".
    appType: 'mpa',
    build: { target: 'chrome89' },
    test: {
      environment: 'jsdom',
      // jsdom solo expone localStorage con un origin http(s) (los mocks del
      // módulo KPI persisten en localStorage). El default de vitest es
      // `about:blank`, que lo deja undefined.
      environmentOptions: { jsdom: { url: 'http://localhost:5176/' } },
      // Node >= 22.4 sombrea el localStorage de jsdom con su global
      // experimental — ver src/__test__/setup.ts.
      setupFiles: ['./src/__test__/setup.ts'],
      globals: true,
      root: '.',
      include: ['src/__test__/**/*.spec.ts'],
    },
  }
})
