import { fileURLToPath, URL } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

// Every server is started from the repo root so the pnpm --filter flags resolve.
const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

const HOST_URL = 'http://localhost:5173'

/**
 * `dev` runs the three Vite dev servers — fast, and what you want while writing
 * a test. `preview` serves the three `dist/` builds instead, and is the ONLY
 * mode that reproduces production Module Federation.
 *
 * The difference matters regardless of the package manager: a dev server serves
 * unminified, unchunked modules, so the `shared` singleton contract is never
 * really exercised and a broken `requiredVersion` can pass dev and fail in
 * production. Against built bundles each app carries its own fallback copy and
 * the runtime has to actually negotiate, which is what these tests are for.
 *
 * See docs/adr/0003-pnpm.md: the federated chunk graph itself differs between a
 * hoisted npm install and a strict pnpm one, so this suite is the only place
 * that verifies the artifact that actually ships.
 *
 * `preview` requires a build first; `pnpm test:e2e:preview` at the repo root
 * does both — the turbo task declares the three builds as dependencies.
 */
const MODE = process.env.E2E_MODE === 'preview' ? 'preview' : 'dev'
const isPreview = MODE === 'preview'

const serve = (workspace: string) => `pnpm --filter ${workspace} run ${MODE}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // one shell, three servers: keep it predictable
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: HOST_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // The host is useless without its remotes, so all three come up together.
  // `reuseExistingServer` lets a local `pnpm dev` session be reused instead
  // of fighting over the ports — but never in preview mode, where reusing a dev
  // server would silently test the exact thing this mode exists to avoid.
  webServer: [
    {
      command: serve('remote-pokemon'),
      url: 'http://localhost:5174/',
      cwd: repoRoot,
      reuseExistingServer: !process.env.CI && !isPreview,
      timeout: 120_000,
    },
    {
      command: serve('remote-dragonball'),
      url: 'http://localhost:5175/',
      cwd: repoRoot,
      reuseExistingServer: !process.env.CI && !isPreview,
      timeout: 120_000,
    },
    {
      command: serve('host'),
      url: HOST_URL,
      cwd: repoRoot,
      reuseExistingServer: !process.env.CI && !isPreview,
      timeout: 120_000,
    },
  ],
})
