// Forward-ready vitest config for tools/ + scripts/ tests.
// Used to verify T2.1 scorer + T2.2 bump-version + T2.3 depth-audit
// invariants until the root vitest config widens to include these dirs.
//
// Usage: npx vitest run --config vitest.tools.config.mjs
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    name: 'tools',
    include: [
      'tools/release-history/__tests__/score-completeness.test.mjs',
      'scripts/__tests__/bump-version.test.mjs',
      'tools/__tests__/depth-audit.test.mjs',
      'tools/__tests__/ftp-sync.test.mjs',
      'tools/__tests__/render-claude-md.test.mjs',
      'tools/__tests__/ship-sync.test.mjs',
      'tools/__tests__/gh-release-publish.test.mjs',
      'tools/__tests__/update-catalog-indexes.test.mjs',
      'scripts/__tests__/serve-dashboard-sse.test.mjs',
      'tools/__tests__/atlas-deps-audit.test.mjs',
      'tools/__tests__/atlas-perf-bench.test.mjs',
      'tools/__tests__/atlas-index-cli.test.mjs',
    ],
    globals: true,
    testTimeout: 15000,
  },
});
