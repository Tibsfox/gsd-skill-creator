// Vitest config for tools/ + scripts/ tests (NOT covered by the root
// vitest.config.ts, which scopes to src/ .college/ tests/ www/).
//
// GATE-ENFORCED as of v1.49.913: pre-tag-gate runs this suite (step "tools-suite",
// SC_SKIP_TOOLS_SUITE to skip). Before that it ran nowhere enforced and silently
// rotted red (15 failing catalog/scorer/ftp tests went unseen for ~2 weeks).
//
// The include list is EXPLICIT (not a glob) because tools/ also holds node:test
// files (Node's built-in runner) that vitest cannot execute. The list is kept in
// sync with disk by tools/check-tools-test-coverage.mjs, exercised via
// tools/__tests__/tools-config-coverage.test.mjs (the Layer-2 drift-guard below).
//
// Usage: npx vitest run --config vitest.tools.config.mjs
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    name: 'tools',
    include: [
      'tools/release-history/__tests__/score-completeness.test.mjs',
      'tools/release-history/__tests__/score-completeness-c5.test.mjs',
      'scripts/__tests__/bump-version.test.mjs',
      'tools/__tests__/depth-audit.test.mjs',
      'tools/__tests__/scaffold-cross-track-dirs.test.mjs',
      'tools/__tests__/scaffold-sps-pages.test.mjs',
      'tools/__tests__/scaffold-trs-packs.test.mjs',
      'tools/__tests__/ps-spec.test.mjs',
      'tools/__tests__/check-sps-cohort-uniqueness.test.mjs',
      'tools/__tests__/ftp-sync.test.mjs',
      'tools/__tests__/ftp-delete.test.mjs',
      'tools/__tests__/render-claude-md.test.mjs',
      'tools/__tests__/ship-sync.test.mjs',
      'tools/__tests__/gh-release-publish.test.mjs',
      'tools/__tests__/update-catalog-indexes.test.mjs',
      'tools/__tests__/update-state-md-on-ship.test.mjs',
      'tools/__tests__/build-trs-edges.test.mjs',
      'tools/__tests__/verify-predecessor-engine-state.test.mjs',
      'scripts/__tests__/serve-dashboard-sse.test.mjs',
      'tools/__tests__/atlas-deps-audit.test.mjs',
      'tools/__tests__/atlas-perf-bench.test.mjs',
      'tools/__tests__/atlas-index-cli.test.mjs',
      'tools/__tests__/tauri-boundary-audit.test.mjs',
      'tools/__tests__/module-reachability.test.mjs',
      'tools/__tests__/college-src-boundary-audit.test.mjs',
      'tools/__tests__/state-md-normalizer.test.mjs',
      'tools/__tests__/state-md-normalizer-prose.test.mjs',
      'tools/__tests__/state-md-set-shipped.test.mjs',
      'tools/__tests__/project-md-normalizer.test.mjs',
      'tools/__tests__/state-md-clean-backups.test.mjs',
      'tools/__tests__/adoption-scan.test.mjs',
      'tools/__tests__/agent-adoption-scan.test.mjs',
      'tools/__tests__/adoption-refresh.test.mjs',
      'tools/__tests__/adoption-trends.test.mjs',
      'tools/__tests__/adoption-baseline-freshness.test.mjs',
      'tools/__tests__/trip-vocab-check.test.mjs',
      'tools/__tests__/perf-assertion-audit.test.mjs',
      'tools/__tests__/perf-assertion-audit-additive.test.mjs',
      'tools/__tests__/check-version-sequence.test.mjs',
      'tools/__tests__/check-discipline-coverage.test.mjs',
      // Layer-2 drift-guard for this very include list (v1.49.913). Backed by
      // tools/check-tools-test-coverage.mjs; fails if a tools/ or scripts/ vitest
      // file is missing here (the rot that hid 15 red tests for ~2 weeks).
      'tools/__tests__/tools-config-coverage.test.mjs',
      // v1.49.913 reconciliation: vitest files that existed on disk under tools/
      // but were never registered here, so they ran NOWHERE enforced.
      'tools/elc-smoke/__tests__/scorer-regex.test.mjs',
      'tools/mus-smoke/__tests__/build-template-instruction.test.mjs',
      'tools/release-history/__tests__/chapter-idempotent.test.mjs',
      'tools/release-history/__tests__/classify-types-chip.test.mjs',
      'tools/release-history/__tests__/run-with-pg-env.test.mjs',
      'tools/release-history/__tests__/db-pg-credentials.test.mjs',
      'tools/release-history/__tests__/refresh-advisory-exit.test.mjs',
      'tools/release-history/__tests__/publish-leak-allowlist.test.mjs',
      'tools/release-history/__tests__/scaffold-release-notes.test.mjs',
      'scripts/__tests__/ci-gate-enum.test.mjs',
      'scripts/__tests__/apply-to-self.test.mjs',
      'scripts/__tests__/apply-to-self-posix-ere.test.mjs',
      'scripts/__tests__/apply-to-self-comment-vs-code.test.mjs',
      'scripts/__tests__/apply-to-self-sweep-substrate.test.mjs',
      'scripts/__tests__/sweep-old-slot-label.test.mjs',
      'scripts/__tests__/append-story-entry.test.mjs',
      'tools/ci/__tests__/macos-flip-readiness.test.mjs',
      'tools/ci/__tests__/cargo-flip-readiness.test.mjs',
      'tools/ci/__tests__/windows-flip-readiness.test.mjs',
      'tools/gate/__tests__/warn-promotion-readiness.test.mjs',
    ],
    globals: true,
    testTimeout: 15000,
  },
});
