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
      // Run via: npm run test:perf (sets VITEST_INCLUDE_PERF=1).
      // Env-gated OUT of the default `vitest run`: these are wall-clock benches
      // whose thresholds flake under full-suite contention, so they must not sit
      // in the blocking lane. (The prior "Excluded from default run" comment was
      // stale — the entry was unconditionally in the array and DID run by default.
      // Item 8 made the exclusion real via VITEST_INCLUDE_PERF.)
      ...(process.env.VITEST_INCLUDE_PERF
        ? [{
            test: {
              name: 'intelligence-perf',
              globals: true,
              testTimeout: 60000,
              include: [
                'src/intelligence/__tests__/performance/**/*.perf.test.ts',
              ],
              exclude: ['**/node_modules/**', 'dist/**'],
            },
          }]
        : []),
      // Integration tests (*.integration.test.ts). NOT opt-in: this project sits in the
      // `projects` array unconditionally, so it runs on every bare `vitest run` — which is
      // exactly what CI (ci.yml `npx vitest run`) and the local pre-tag-gate execute.
      // `vitest run --project integration` RESTRICTS a run to ONLY this project (focused
      // local runs); it does not enable an otherwise-skipped project.
      // The PROJECT is not env-gated. Individual files may self-skip at runtime — e.g.
      // src/critique/loop.integration.test.ts gates its describe block behind
      // GSD_CRITIQUE_INTEGRATION=1 — but that is per-file, not project-level.
      // (Corrected after v1.49.940: the prior "env-gated / opt-in only" comment was false
      // and had obscured that the gateway fixed-port race was a latent CI flake, not a
      // local-only gate annoyance.)
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
