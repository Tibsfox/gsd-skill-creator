import { describe, it, expect } from 'vitest';
import {
  classifySignal,
  consolidate,
  consolidateGroup,
  type CapturedSignal,
} from './experience-router.js';

describe('classifySignal — routing along the episodic→procedural→declarative axis', () => {
  it('routes a one-off correction to episodic memory', () => {
    const signal: CapturedSignal = {
      id: 'sig-oneoff',
      payload: 'user reworded the summary paragraph once',
      occurrences: 1,
    };
    const decision = classifySignal(signal);
    expect(decision.level).toBe('episodic');
    expect(decision.target).toBe('memory');
    expect(decision.confidence).toBeGreaterThan(0);
    expect(decision.rationale).toMatch(/episodic|memory/i);
  });

  it('routes a recurring pattern to a procedural skill candidate', () => {
    const signal: CapturedSignal = {
      id: 'sig-recurring',
      payload: { step: 'validate then commit', shape: 'consistent' },
      occurrences: 3,
      tags: ['structural-pattern'],
    };
    const decision = classifySignal(signal);
    expect(decision.level).toBe('procedural');
    expect(decision.target).toBe('skill-candidate');
  });

  it('routes a stable invariant to a declarative College rule', () => {
    const signal: CapturedSignal = {
      id: 'sig-invariant',
      payload: { rule: 'src/ never imports desktop/@tauri-apps/api' },
      occurrences: 12,
      tags: ['rule-form'],
    };
    const decision = classifySignal(signal);
    expect(decision.level).toBe('declarative');
    expect(decision.target).toBe('college-rule');
  });

  it('honours an explicit high abstractionDepth for the declarative tier', () => {
    const signal: CapturedSignal = {
      id: 'sig-abstract',
      payload: { invariant: true },
      occurrences: 8,
      variabilityScore: 0.05,
      abstractionDepth: 4,
    };
    expect(classifySignal(signal).level).toBe('declarative');
  });
});

describe('consolidateGroup — density-gated upward promotion advice (advisory only)', () => {
  const makeGroup = (n: number, key: string): CapturedSignal[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `${key}-${i}`,
      payload: `correction ${i} on ${key}`,
      groupKey: key,
      occurrences: 1,
    }));

  it('does NOT advise promotion for a low-density group', () => {
    const advice = consolidateGroup(makeGroup(2, 'file-a.ts'));
    expect(advice.currentLevel).toBe('episodic');
    expect(advice.shouldPromote).toBe(false);
    expect(advice.promoteTo).toBeNull();
  });

  it('advises promotion to procedural once density passes the ROI gate', () => {
    const advice = consolidateGroup(makeGroup(6, 'file-b.ts'));
    expect(advice.currentLevel).toBe('episodic');
    expect(advice.shouldPromote).toBe(true);
    expect(advice.promoteTo).toBe('procedural');
    expect(advice.occurrences).toBe(6);
  });

  it('respects a caller-supplied installCostBits threshold', () => {
    const cheap = consolidateGroup(makeGroup(3, 'file-c.ts'), { installCostBits: 1 });
    expect(cheap.shouldPromote).toBe(true);
    const dear = consolidateGroup(makeGroup(3, 'file-c.ts'), { installCostBits: 100 });
    expect(dear.shouldPromote).toBe(false);
  });
});

describe('consolidate — groups accumulated signals by key', () => {
  it('produces one advice row per group key, density summed', () => {
    const signals: CapturedSignal[] = [
      { id: 'a1', payload: 'x', groupKey: 'alpha', occurrences: 1 },
      { id: 'a2', payload: 'y', groupKey: 'alpha', occurrences: 1 },
      { id: 'b1', payload: 'z', groupKey: 'beta', occurrences: 1 },
    ];
    const rows = consolidate(signals);
    expect(rows).toHaveLength(2);
    const alpha = rows.find((r) => r.groupKey === 'alpha');
    expect(alpha?.occurrences).toBe(2);
    const beta = rows.find((r) => r.groupKey === 'beta');
    expect(beta?.occurrences).toBe(1);
  });
});
