import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import boundaries from 'eslint-plugin-boundaries'
import skipFormatting from 'eslint-config-prettier/flat'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  {
    name: 'app/hexagonal-boundaries',
    files: ['src/**/*.{ts,vue}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true } },
      'boundaries/elements': [
        { type: 'domain', pattern: ['src/modules/*/domain/**'], capture: ['module'] },
        { type: 'application', pattern: ['src/modules/*/application/**'], capture: ['module'] },
        { type: 'infra', pattern: ['src/modules/*/infrastructure/**'], capture: ['module'] },
        { type: 'presentation', pattern: ['src/modules/*/presentation/**'], capture: ['module'] },
        // Cross-cutting
        { type: 'shared-domain', pattern: ['src/modules/shared/domain/**'] },
        { type: 'shared-app', pattern: ['src/modules/shared/application/**'] },
        { type: 'shared-infra', pattern: ['src/modules/shared/infrastructure/**'] },
        { type: 'shared-pres', pattern: ['src/modules/shared/presentation/**'] },
        { type: 'base', pattern: ['src/base/**'] },
      ],
      // The router is a composition root: it wires the layout to the remote's
      // routes by design. `src/types` only holds ambient declarations of the
      // federated modules, which belong to no layer.
      'boundaries/ignore': ['**/*.spec.ts', 'src/base/config/router/**', 'src/types/**'],
    },
    rules: {
      'boundaries/element-types': [
        2,
        {
          default: 'disallow',
          rules: [
            {
              from: ['domain'],
              allow: [['domain', { module: '${from.module}' }], 'shared-domain', 'base'],
            },
            {
              from: ['application'],
              allow: [
                ['domain', { module: '${from.module}' }],
                ['application', { module: '${from.module}' }],
                'shared-domain',
                'shared-app',
                'base',
              ],
            },
            {
              from: ['infra'],
              allow: [
                ['domain', { module: '${from.module}' }],
                ['application', { module: '${from.module}' }],
                ['infra', { module: '${from.module}' }],
                'shared-domain',
                'shared-app',
                'shared-infra',
                'base',
              ],
            },
            {
              from: ['presentation'],
              allow: [
                ['domain', { module: '${from.module}' }],
                ['application', { module: '${from.module}' }],
                ['presentation', { module: '${from.module}' }],
                'shared-domain',
                'shared-app',
                'shared-pres',
                'base',
              ],
            },
            { from: ['shared-domain'], allow: ['shared-domain', 'base'] },
            { from: ['shared-app'], allow: ['shared-domain', 'shared-app', 'base'] },
            {
              from: ['shared-infra'],
              allow: ['shared-domain', 'shared-app', 'shared-infra', 'base'],
            },
            {
              from: ['shared-pres'],
              allow: ['shared-domain', 'shared-app', 'shared-pres', 'base'],
            },
            { from: ['base'], allow: ['base'] },
          ],
        },
      ],
      'boundaries/no-unknown': [2],
    },
  },

  skipFormatting,
)
