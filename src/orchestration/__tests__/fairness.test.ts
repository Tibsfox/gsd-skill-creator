/**
 * Selector fairness invariant: every candidate has non-zero selection
 * probability given sufficient ligand intensity. In the scalar-score
 * formulation that means: every candidate whose composite score > 0 appears
 * in the output ranking (it is never silently dropped below the threshold).
 *
 * @module orchestration/__tests__/fairness.test
 */

import { describe, it, expect, afterEach } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { ActivationSelector, type Candidate } from '../selector.js';
import { ActivationWriter } from '../../traces/activation-writer.js';

const cleanups: string[] = [];
function tempTraceFile(): string {
  const dir = join(tmpdir(), `m5-fairness-test-${randomUUID()}`);
  cleanups.push(dir);
  return join(dir, 'traces.jsonl');
}
afterEach(async () => {
  for (const d of cleanups.splice(0)) {
    await fs.rm(d, { recursive: true, force: true });
  }
});

describe('Selector fairness invariant', () => {
  it('every candidate with matching ligand signal is returned', async () => {
    const now = Date.now();
    // Every candidate shares at least one query token; composite > 0 for all.
    const cands: Candidate[] = [];
    for (let i = 0; i < 20; i++) {
      cands.push({
        id: `cand-${i}`,
        content: `task requires attention from candidate-${i}`,
        ts: now,
        importance: 0.1,
      });
    }
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
    });
    const decisions = await sel.select('task attention', cands);
    expect(decisions.length).toBe(cands.length);
    for (const d of decisions) {
      expect(d.score).toBeGreaterThan(0);
    }
  });

  it('activation rate is non-zero across the full candidate pool', async () => {
    const now = Date.now();
    const cands: Candidate[] = [];
    for (let i = 0; i < 50; i++) {
      cands.push({
        id: `c-${i}`,
        content: `relevant signal ${i} for activation`,
        ts: now,
        importance: 0.2,
      });
    }
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
    });
    const decisions = await sel.select('relevant activation', cands);
    const activatedCount = decisions.filter((d) => d.activated).length;
    expect(activatedCount).toBeGreaterThan(0);
    // fairness: activations should cover a meaningful slice of the pool.
    expect(activatedCount / decisions.length).toBeGreaterThan(0.5);
  });

  it('no candidate is permanently locked out across many selections', async () => {
    const now = Date.now();
    const pool: Candidate[] = [];
    for (let i = 0; i < 10; i++) {
      pool.push({
        id: `skill-${i}`,
        content: `skill-${i} matches varied query tokens like q${i} and shared-vocab`,
        ts: now,
        importance: 0.3,
      });
    }
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      topK: 3,
    });
    const seen = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const decisions = await sel.select(`q${i} shared-vocab`, pool);
      for (const d of decisions) seen.add(d.id);
    }
    // Every candidate should appear in the top-3 of at least one of the
    // 10 specialised queries — fairness through query diversity.
    for (const c of pool) {
      expect(seen.has(c.id)).toBe(true);
    }
  });
});
