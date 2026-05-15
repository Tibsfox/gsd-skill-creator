// Vitest bench config (v1.49.653 L-05 — CONCERNS §20).
//
// Runs *.bench.ts files under src/ via `vitest bench` and emits JSON results
// to tools/bench/last-run.json. Compare against baseline via:
//   npm run bench:check
//
// See: tools/bench/README.md (if present) and tools/bench/baseline.json.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/__benches__/**/*.bench.ts'],
    // Benches run isolated; no globals, no setup files.
    benchmark: {
      include: ['src/**/__benches__/**/*.bench.ts'],
      outputJson: 'tools/bench/last-run.json',
    },
    // No timeout shimming — benches manage their own iteration counts.
  },
});
