import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { describe, expect, it } from 'vitest'
import semver from 'semver'
import { sharedSingletons } from '../src/index'

/**
 * Centralising `sharedSingletons` stopped the three apps from DECLARING
 * different singleton ranges. It cannot, on its own, stop the declared range
 * from drifting away from what the apps actually install: bump an app to Vue 4
 * in its package.json and `requiredVersion: '^3.5.0'` silently becomes a lie,
 * the build stays green, and Module Federation loads two Vues in production.
 *
 * This is the guard for that: the federation contract must remain a superset
 * of what every app depends on.
 */

const APPS = ['host', 'remote-pokemon', 'remote-dragonball'] as const

function dependenciesOf(app: string): Record<string, string> {
  const path = fileURLToPath(new URL(`../../../apps/${app}/package.json`, import.meta.url))
  return JSON.parse(readFileSync(path, 'utf8')).dependencies ?? {}
}

describe.each(APPS)('%s', (app) => {
  const dependencies = dependenciesOf(app)

  it.each(Object.keys(sharedSingletons))('depends on the shared singleton %s', (name) => {
    // A library listed in `shared` that the app no longer installs means the
    // contract describes a dependency that is not there any more.
    expect(dependencies[name], `${app} does not depend on ${name}`).toBeDefined()
  })

  it.each(Object.entries(sharedSingletons))(
    'installs %s within the federated range',
    (name, { requiredVersion }) => {
      const declared = dependencies[name]
      if (!declared) return // reported by the test above

      // `subset` asks the real question: can this app ever resolve a version
      // that the federated contract would reject? If yes, the shell and this
      // remote can end up with two separate copies at runtime.
      expect(
        semver.subset(declared, requiredVersion),
        `${app} declares ${name}@${declared}, which is not within the federated ` +
          `requiredVersion ${requiredVersion} — update packages/mf-shared or the app`,
      ).toBe(true)
    },
  )
})
