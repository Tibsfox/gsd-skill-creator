/**
 * CF-H-020c — session-state.cjs SessionStart latency benchmark (<200ms p50).
 *
 * WARN-only wall-clock bench. Relocated out of
 * src/__tests__/hooks-integration/session-start-latency.test.ts (the blocking
 * root lane) into the intelligence-perf project (item 8), which is env-gated off
 * the default `vitest run` — a subprocess-spawn latency budget under full-suite
 * contention is a rotating flake, not a ship blocker. Run via `npm run test:perf`
 * (VITEST_INCLUDE_PERF=1). The CF-H-020a/b consolidation count-checks stay
 * blocking in the original file.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();
const SESSION_STATE_HOOK = join(REPO_ROOT, '.claude', 'hooks', 'session-state.cjs');

describe('OGA-020 — SessionStart latency (WARN-only bench)', () => {
  it('CF-H-020c: session-state.cjs latency benchmark <200ms over 10 runs', () => {
    if (!existsSync(SESSION_STATE_HOOK)) {
      // Hook may be absent in clean checkouts; skip rather than fail.
      return;
    }
    const input = JSON.stringify({ session_id: 'c1-bench', cwd: REPO_ROOT });
    const samples: number[] = [];
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      execFileSync('node', [SESSION_STATE_HOOK], {
        input,
        encoding: 'utf8',
        timeout: 5000,
      });
      samples.push(Date.now() - start);
    }
    const max = Math.max(...samples);
    const median = [...samples].sort((a, b) => a - b)[Math.floor(samples.length / 2)];
    // Budget: <200ms p50; allow generous p100 since CI cold-cache can spike.
    expect(median).toBeLessThan(200);
    expect(max).toBeLessThan(1000);
  });
});
