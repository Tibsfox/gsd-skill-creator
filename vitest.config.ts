import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { existsSync } from 'fs';

// www/ is gitignored (deployed via FTP). Tests under tests/spice-renderer/ +
// tests/spice-symbols.test.ts statically import from www/.../_harness/v1.0.0/
// so they only run where that tree exists — locally always, in CI never.
const wwwHarnessAvailable = existsSync(
  resolve(import.meta.dirname!, 'www/tibsfox/com/Research/NASA/_harness/v1.0.0/spice-loader.js'),
);

export default defineConfig({
  test: {
    // Increase timeout for tests that load embeddings models
    testTimeout: 10000,
    globals: true,
    projects: [
      // Root project — existing tests (src/, .college/, etc.)
      // testTimeout: 60000 covers integration tests that spawn bash subprocesses
      // for shell-script contracts (e.g. src/intelligence/__tests__/c12-end-to-end-flow.test.ts
      // T11 "full flow" exercises load-kb-context.sh via execFileSync; the subprocess-
      // spawn + shell-startup + script-execution chain runs ~3s isolated but balloons
      // under full-suite load + concurrent worker contention).
      // Bumped 20s → 60s at v1.49.608: 3 consecutive pre-tag-gate runs flaked at 20s
      // on different c12-end-to-end-flow tests under full-suite load (1844-file run).
      // All pass cleanly in isolation; the 20s budget was too tight for full-suite
      // contention. 60s gives generous headroom; isolated runtime stays ~3-9s.
      {
        test: {
          name: 'root',
          globals: true,
          testTimeout: 60000,
          // hookTimeout: vitest default is 10000ms regardless of testTimeout.
          // src/intelligence/__tests__/ tests use beforeEach(async () => seedKB())
          // which spins up a tmpdir SQLite + runs migrations; under full-suite
          // contention this exceeds 10s. Match testTimeout headroom (60s).
          // Surfaced at v1.49.667 pre-tag-gate: atlas-bridge.test.ts +
          // dashboard-bridge-phase-827.test.ts hookTimeout flakes.
          hookTimeout: 60000,
          include: [
            'src/**/*.test.ts',
            'src/**/*.test.tsx',
            '.college/**/*.test.ts',
            '.college/**/*.test.tsx',
            'tests/**/*.test.ts',
            'www/tibsfox/com/Research/NASA/_harness/**/*.test.ts',
          ],
          exclude: [
            'dist/**',
            'desktop/**',
            'apps/the-space-between-engine/**',
            'tests/ipc-commands.test.ts',
            '.claude/**',
            'project-claude/**',
            'node_modules/**',
            '**/*.integration.test.ts',
            '**/*.system.test.ts',
            // Performance tests run via `npm run test:perf` (advisory, WARN-only, not BLOCK).
            'src/intelligence/__tests__/performance/**',
            ...(wwwHarnessAvailable ? [] : [
              'tests/spice-renderer/**',
              'tests/spice-symbols.test.ts',
            ]),
          ],
        },
      },
      // The Space Between Engine — needs @/ alias and jsdom
      {
        resolve: {
          alias: {
            '@': resolve(import.meta.dirname!, './apps/the-space-between-engine/src'),
          },
        },
        test: {
          name: 'space-between',
          root: './apps/the-space-between-engine',
          globals: true,
          testTimeout: 15000,
          environment: 'jsdom',
          include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
          exclude: ['**/node_modules/**'],
        },
      },
      // Intelligence Dashboard UI tests (Phase 824 C08/C09 — desktop/intelligence/).
      // Uses jsdom environment to simulate browser DOM. No Node module imports allowed (S10).
      {
        test: {
          name: 'intelligence-ui',
          globals: true,
          environment: 'jsdom',
          include: [
            'desktop/intelligence/**/*.test.ts',
            'desktop/intelligence/**/*.test.tsx',
          ],
          exclude: ['**/node_modules/**', 'dist/**'],
        },
      },
      // Intelligence Dashboard performance tests (WARN-only, advisory).
      // Run via: npm run test:perf
      // Excluded from default run to avoid flakiness in CI.
      {
        test: {
          name: 'intelligence-perf',
          globals: true,
          testTimeout: 60000,
          include: [
            'src/intelligence/__tests__/performance/**/*.perf.test.ts',
          ],
          exclude: ['**/node_modules/**', 'dist/**'],
        },
      },
      // Integration tests — env-gated via GSD_*_INTEGRATION=1 inside the files.
      // Opt-in only: selected via `vitest run --project integration`.
      {
        test: {
          name: 'integration',
          globals: true,
          testTimeout: 15000,
          include: [
            'src/**/*.integration.test.ts',
            'tests/**/*.integration.test.ts',
            '.college/**/*.integration.test.ts',
          ],
          exclude: [
            'dist/**',
            'desktop/**',
            'node_modules/**',
          ],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['.college/**/*.ts'],
      exclude: [
        '.college/**/*.test.ts',
        '.college/**/*.integration.test.ts',
        '.college/departments/test-department/**',
      ],
      reporter: ['text', 'text-summary', 'json-summary'],
      reportsDirectory: '.college/coverage',
      thresholds: {
        statements: 85,
        branches: 85,
        functions: 85,
        lines: 85,
      },
    },
  },
});
