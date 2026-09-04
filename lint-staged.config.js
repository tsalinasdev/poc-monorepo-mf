// Each app owns its own flat ESLint config, and flat configs resolve their `files`
// patterns against the CWD. Running `eslint` from the repo root would therefore match
// nothing, so staged files are routed to their own workspace's lint script instead.
export default {
  'apps/host/**/*.{ts,vue}': () => 'pnpm --filter host run lint:fix',
  'apps/remote-pokemon/**/*.{ts,vue}': () => 'pnpm --filter remote-pokemon run lint:fix',
  'apps/remote-dragonball/**/*.{ts,vue}': () => 'pnpm --filter remote-dragonball run lint:fix',
  // Build-time-only workspace packages have no ESLint config of their own.
  'packages/*/src/**/*.ts': 'prettier --write',
  '*.{json,md,js,ts}': 'prettier --write',
}
