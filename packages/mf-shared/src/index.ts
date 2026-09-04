/**
 * Build-time Module Federation contract shared by the shell and every remote.
 *
 * WHY THIS PACKAGE EXISTS
 * Each app builds and deploys on its own, so the `shared` block is the only
 * thing that makes them agree on which libraries must resolve to ONE instance
 * at runtime. Declaring it three times by hand meant nothing failed when the
 * copies drifted — and drift here does not break the build, it breaks
 * production (two Vue copies -> `inject()` finds nothing; two routers -> the
 * remote's screens never see the shell's navigation).
 *
 * WHY IT IS SAFE TO SHARE THIS, UNLIKE MOST CODE
 * Everything here is consumed by `vite.config.ts` in Node, at build time, and
 * never reaches the browser. A workspace package that ships *runtime* code is a
 * different story: it would be bundled into every remote (N copies, N copies of
 * any module-level state) unless it is itself declared in `shared` — and a
 * workspace dependency resolves to a symlink at version 0.0.0, which makes
 * `requiredVersion` negotiation meaningless.
 *
 * So: build-time metadata only. Never add runtime code, Vue components,
 * stores or DI containers to this package.
 */

/** Minimal shape of a Module Federation `shared` entry, kept dependency-free. */
export interface SharedDependencyConfig {
  singleton: boolean
  requiredVersion: string
}

export type SharedDependencies = Record<string, SharedDependencyConfig>

/**
 * Libraries that MUST resolve to a single instance across the whole page.
 *
 * These are NOT marked `import: false`: keeping each app's local fallback is
 * what lets a remote still run standalone (`npm run dev -w remote-pokemon`)
 * with no shell around it.
 *
 * `requiredVersion` is a range, not an exact version, so the shell and a remote
 * built weeks apart can still agree. Widening a range here is a deliberate
 * compatibility decision — make it once, for everyone, in this file.
 */
export const sharedSingletons = {
  vue: { singleton: true, requiredVersion: '^3.5.0' },
  'vue-router': { singleton: true, requiredVersion: '^5.0.0' },
  pinia: { singleton: true, requiredVersion: '^3.0.0' },
  '@pinia/colada': { singleton: true, requiredVersion: '^1.3.0' },
} as const satisfies SharedDependencies
