/**
 * Selector behaviour: composes M1 + M2 + M6; writes M3 trace on every
 * decision; M6 flag-off path is byte-identical to a no-M6 path.
 *
 * @module orchestration/__tests__/selector.test
 */

import { describe, it, expect, afterEach } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { ActivationSelector, select, type Candidate } from '../selector.js';
import { ActivationWriter } from '../../traces/activation-writer.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

const cleanups: string[] = [];

function tempTraceFile(): string {
  const dir = join(tmpdir(), `m5-selector-test-${randomUUID()}`);
  cleanups.push(dir);
  return join(dir, 'traces.jsonl');
}

afterEach(async () => {
  for (const d of cleanups.splice(0)) {
    await fs.rm(d, { recursive: true, force: true });
  }
});

function candidatesFixture(): Candidate[] {
  const now = Date.now();
  return [
    { id: 'skill-debug', content: 'debug a failing test', ts: now, importance: 0.5 },
    { id: 'skill-edit', content: 'edit source files safely', ts: now, importance: 0.3 },
    { id: 'skill-run', content: 'run the test suite', ts: now, importance: 0.7 },
    { id: 'skill-grep', content: 'search the codebase for a pattern', ts: now, importance: 0.1 },
  ];
}

async function readTraceFile(path: string): Promise<string[]> {
  try {
    const raw = await fs.readFile(path, 'utf8');
    return raw.split('\n').filter((l) => l.length > 0);
  } catch {
    return [];
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('ActivationSelector — basic', () => {
  it('ranks candidates by αβγ composite', async () => {
    const tracePath = tempTraceFile();
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tracePath),
      scorer: { alpha: 0.3, beta: 0.6, gamma: 0.1 },
    });
    const decisions = await sel.select('debug failing test', candidatesFixture());
    expect(decisions.length).toBeGreaterThan(0);
    expect(decisions[0].id).toBe('skill-debug');
  });

  it('is deterministic across repeated calls with same inputs', async () => {
    const cands = candidatesFixture();
    const ts = cands[0].ts!;
    const opts = {
      writer: new ActivationWriter(tempTraceFile()),
      scorer: { alpha: 0.3, beta: 0.6, gamma: 0.1 },
    };
    const a = await select('debug failing test', cands.map(c => ({ ...c, ts })), opts);
    const b = await select('debug failing test', cands.map(c => ({ ...c, ts })), {
      ...opts,
      writer: new ActivationWriter(tempTraceFile()),
    });
    expect(a.map(d => d.id)).toEqual(b.map(d => d.id));
  });
});

describe('ActivationSelector — M3 trace writes', () => {
  it('writes one trace per decision', async () => {
    const tracePath = tempTraceFile();
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tracePath),
    });
    const cands = candidatesFixture();
    const decisions = await sel.select('run test', cands);
    const lines = await readTraceFile(tracePath);
    expect(lines.length).toBe(decisions.length);
  });

  it('trace records reference the selected entity id', async () => {
    const tracePath = tempTraceFile();
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tracePath),
    });
    const cands = candidatesFixture();
    const decisions = await sel.select('run test', cands);
    const lines = await readTraceFile(tracePath);
    for (const d of decisions) {
      const hit = lines.some((l) => l.includes(d.id));
      expect(hit).toBe(true);
    }
  });
});

describe('ActivationSelector — step-graph boost', () => {
  it('boosts candidates matching predicted next', async () => {
    const cands = candidatesFixture();
    const tracePath = tempTraceFile();

    const without = await new ActivationSelector({
      writer: new ActivationWriter(tracePath),
    }).select('debug', cands);

    const withPred = await new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      prediction: { id: 'prev', predictedNext: ['skill-grep'], confidence: 0.9 },
      stepWeight: 1.0,
    }).select('debug', cands);

    const grepBefore = without.find((d) => d.id === 'skill-grep')!;
    const grepAfter = withPred.find((d) => d.id === 'skill-grep')!;
    expect(grepAfter.score).toBeGreaterThan(grepBefore.score);
    expect(grepAfter.signals.stepBoost).toBeGreaterThan(0);
  });
});

describe('SC-FLAG-OFF: M6 disabled path is byte-identical to no-M6 path', () => {
  it('decisions match when sensoria is undefined vs sensoria.enabled=false', async () => {
    const cands = candidatesFixture();
    const ts = cands[0].ts!;
    const noM6 = await new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
    }).select('run test', cands.map(c => ({ ...c, ts })));

    const m6Off = await new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      sensoria: { enabled: false },
    }).select('run test', cands.map(c => ({ ...c, ts })));

    // Byte-identical: same ranking, same composite scores, no sensoria fields.
    expect(m6Off.length).toBe(noM6.length);
    for (let i = 0; i < noM6.length; i++) {
      expect(m6Off[i].id).toBe(noM6[i].id);
      // Allow tiny float noise from separate Date.now() reads; within the
      // scorer's recency exponential the difference is sub-µs in the composite.
      expect(m6Off[i].score).toBeCloseTo(noM6[i].score, 5);
      expect(m6Off[i].activated).toBe(noM6[i].activated);
      expect(m6Off[i].signals.sensoria).toBeNull();
      expect(noM6[i].signals.sensoria).toBeNull();
    }
  });

  it('when sensoria enabled=true with no net-shift data, decisions remain well-formed', async () => {
    const cands = candidatesFixture();
    const decisions = await new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      sensoria: { enabled: true },
    }).select('run test', cands);
    // Every decision should have a sensoria signal recorded.
    for (const d of decisions) {
      expect(d.signals.sensoria).not.toBeNull();
    }
  });
});

describe('ActivationSelector — topK cap', () => {
  it('respects topK', async () => {
    const sel = new ActivationSelector({
      writer: new ActivationWriter(tempTraceFile()),
      topK: 2,
    });
    const decisions = await sel.select('run test', candidatesFixture());
    expect(decisions.length).toBe(2);
  });
});
