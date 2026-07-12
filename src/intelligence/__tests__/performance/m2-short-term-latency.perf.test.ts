/**
 * CF-M2-02 — short-term p95 read latency < 10ms on 1000-entry fixture.
 *
 * WARN-only wall-clock bench. Relocated out of src/memory/__tests__/ (the
 * blocking root lane) into the intelligence-perf project (item 8), which is
 * env-gated off the default `vitest run` — a p95 threshold under full-suite
 * contention is a rotating flake, not a ship blocker. Run via `npm run test:perf`
 * (VITEST_INCLUDE_PERF=1). The functional short-term-memory cases stay blocking
 * in the original file.
 */
import { describe, it, expect } from 'vitest';
import { ShortTermMemory } from '../../../memory/short-term.js';
import type { MemoryEntry } from '../../../types/memory.js';

function makeEntry(id: string, content: string, ts?: number): MemoryEntry {
  return {
    id,
    content,
    ts:    ts ?? Date.now(),
    alpha: 0.4,
    beta:  0.4,
    gamma: 0.2,
    score: 0,
  };
}

function make1000Entries(): MemoryEntry[] {
  const now = Date.now();
  const entries: MemoryEntry[] = [];
  const words = [
    'debug', 'session', 'skill', 'refactoring', 'command',
    'pipeline', 'test', 'build', 'deploy', 'merge',
  ];
  for (let i = 0; i < 1000; i++) {
    const w1 = words[i % words.length];
    const w2 = words[(i + 3) % words.length];
    entries.push(makeEntry(`e${i}`, `${w1} ${w2} workflow step ${i}`, now - i * 1000));
  }
  return entries;
}

/** Measure p95 latency for `fn` run `n` times. */
function p95Latency(fn: () => void, n = 100): number {
  // Warmup: discard the first 20 samples to let v8 tier up + caches warm.
  // CF-M2-02 measures steady-state p95, not cold-start latency.
  for (let i = 0; i < 20; i++) fn();
  const times: number[] = [];
  for (let i = 0; i < n; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  return times[Math.floor(n * 0.95)];
}

describe('CF-M2-02: short-term read latency < 10ms p95 (WARN-only bench)', () => {
  it('p95 read latency on 1000-entry fixture is < 10ms', () => {
    const stm = new ShortTermMemory({ capacity: 1024 });
    const entries = make1000Entries();

    // Pre-load all 1000 entries.
    for (const e of entries) stm.write(e);
    expect(stm.size).toBeLessThanOrEqual(1024);

    // Measure p95 read latency.
    const p95 = p95Latency(() => {
      stm.read('debug session skill');
    }, 100);

    expect(p95).toBeLessThan(10);
  });
});
