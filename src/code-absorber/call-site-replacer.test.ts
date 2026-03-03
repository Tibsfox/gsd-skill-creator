import { describe, it, expect, vi } from 'vitest';
import {
  planReplacementCycles,
  executeReplacementCycles,
  CallSiteReplacer,
} from './call-site-replacer.js';
import type { CallSiteRecord, ReplacementCycleInput } from './call-site-replacer.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSite(n: number): CallSiteRecord {
  return {
    filePath: `/src/file${n}.ts`,
    lineNumber: n,
    originalImport: `import { fn } from 'pkg'`,
    replacementImport: `import { fn } from './internal/fn.js'`,
  };
}

function makeSites(count: number): CallSiteRecord[] {
  return Array.from({ length: count }, (_, i) => makeSite(i + 1));
}

// ─── planReplacementCycles ────────────────────────────────────────────────────

describe('planReplacementCycles', () => {
  it('returns empty plan for 0 call sites', () => {
    const plan = planReplacementCycles('pkg', []);
    expect(plan.totalCallSites).toBe(0);
    expect(plan.cycleCount).toBe(0);
    expect(plan.cycles).toHaveLength(0);
  });

  it('1 call site → 1 cycle of 1', () => {
    const plan = planReplacementCycles('pkg', makeSites(1));
    expect(plan.cycleCount).toBe(1);
    expect(plan.cycles[0]).toHaveLength(1);
  });

  it('5 call sites → cycles of 1 each (ceil(5*0.20)=1, so 5 cycles)', () => {
    const plan = planReplacementCycles('pkg', makeSites(5));
    expect(plan.cycles.every(c => c.length === 1)).toBe(true);
    expect(plan.cycleCount).toBe(5);
  });

  it('10 call sites → cycles of 2 each (ceil(10*0.20)=2, 5 cycles)', () => {
    const plan = planReplacementCycles('pkg', makeSites(10));
    expect(plan.cycleCount).toBe(5);
    expect(plan.cycles.every(c => c.length === 2)).toBe(true);
  });

  it('100 call sites → cycles of 20 (ceil(100*0.20)=20, 5 cycles)', () => {
    const plan = planReplacementCycles('pkg', makeSites(100));
    expect(plan.cycleCount).toBe(5);
    expect(plan.cycles.every(c => c.length === 20)).toBe(true);
  });

  it('each cycle contains at most 20% of total call sites', () => {
    const sites = makeSites(47);
    const plan = planReplacementCycles('pkg', sites);
    const maxPerCycle = Math.ceil(47 * 0.20); // = 10
    for (const cycle of plan.cycles) {
      expect(cycle.length).toBeLessThanOrEqual(maxPerCycle);
    }
  });

  it('all call sites covered across all cycles (no duplicates, no omissions)', () => {
    const sites = makeSites(23);
    const plan = planReplacementCycles('pkg', sites);
    const allInCycles = plan.cycles.flat();
    expect(allInCycles).toHaveLength(23);
    // No duplicates — each filePath+lineNumber should be unique
    const paths = allInCycles.map(s => s.filePath);
    expect(new Set(paths).size).toBe(23);
  });
});

// ─── executeReplacementCycles ─────────────────────────────────────────────────

describe('executeReplacementCycles', () => {
  it('all verify=true → all cycles execute, verifiedInCycle counts match', async () => {
    const sites = makeSites(10);
    const verify = vi.fn().mockResolvedValue(true);
    const input: ReplacementCycleInput = { packageName: 'pkg', callSites: sites, verify };
    const cycles = await executeReplacementCycles(input);
    expect(cycles).toHaveLength(5); // 10 sites at 2/cycle
    expect(cycles.every(c => c.failedInCycle === 0)).toBe(true);
    expect(cycles.every(c => c.verifiedInCycle === c.replacedInCycle)).toBe(true);
  });

  it('verify failure in cycle 1 → stops after cycle 1, failedInCycle > 0', async () => {
    const sites = makeSites(10);
    const verify = vi.fn().mockResolvedValue(false); // always fail
    const input: ReplacementCycleInput = { packageName: 'pkg', callSites: sites, verify };
    const cycles = await executeReplacementCycles(input);
    expect(cycles).toHaveLength(1); // stopped after cycle 1
    expect(cycles[0].failedInCycle).toBeGreaterThan(0);
  });

  it('verify failure in cycle 2 → cycle 1 succeeds, cycle 2 stops further cycles', async () => {
    const sites = makeSites(10); // 5 cycles of 2
    let callCount = 0;
    const verify = vi.fn().mockImplementation(async () => {
      callCount++;
      // First 2 pass (cycle 1), next 2 fail (cycle 2)
      return callCount <= 2;
    });
    const input: ReplacementCycleInput = { packageName: 'pkg', callSites: sites, verify };
    const cycles = await executeReplacementCycles(input);
    expect(cycles).toHaveLength(2);
    expect(cycles[0].failedInCycle).toBe(0);
    expect(cycles[1].failedInCycle).toBeGreaterThan(0);
  });

  it('cycleNumber is 1-based', async () => {
    const sites = makeSites(10);
    const verify = vi.fn().mockResolvedValue(true);
    const input: ReplacementCycleInput = { packageName: 'pkg', callSites: sites, verify };
    const cycles = await executeReplacementCycles(input);
    expect(cycles[0].cycleNumber).toBe(1);
    expect(cycles[4].cycleNumber).toBe(5);
  });

  it('replacedInCycle matches the size of that cycle group', async () => {
    const sites = makeSites(10); // 5 cycles of 2
    const verify = vi.fn().mockResolvedValue(true);
    const input: ReplacementCycleInput = { packageName: 'pkg', callSites: sites, verify };
    const cycles = await executeReplacementCycles(input);
    expect(cycles.every(c => c.replacedInCycle === 2)).toBe(true);
  });

  it('totalCallSites is always the full count (not remaining)', async () => {
    const sites = makeSites(10);
    const verify = vi.fn().mockResolvedValue(true);
    const input: ReplacementCycleInput = { packageName: 'pkg', callSites: sites, verify };
    const cycles = await executeReplacementCycles(input);
    expect(cycles.every(c => c.totalCallSites === 10)).toBe(true);
  });

  it('returns empty array for 0 call sites', async () => {
    const verify = vi.fn();
    const input: ReplacementCycleInput = { packageName: 'pkg', callSites: [], verify };
    const cycles = await executeReplacementCycles(input);
    expect(cycles).toHaveLength(0);
    expect(verify).not.toHaveBeenCalled();
  });

  // ─── Class wrapper ────────────────────────────────────────────────────────────

  it('class wrapper plan() delegates to planReplacementCycles', () => {
    const replacer = new CallSiteReplacer();
    const plan = replacer.plan('pkg', makeSites(10));
    expect(plan.totalCallSites).toBe(10);
    expect(plan.cycleCount).toBe(5);
  });

  it('class wrapper execute() delegates to executeReplacementCycles', async () => {
    const replacer = new CallSiteReplacer();
    const verify = vi.fn().mockResolvedValue(true);
    const cycles = await replacer.execute({
      packageName: 'pkg',
      callSites: makeSites(10),
      verify,
    });
    expect(cycles).toHaveLength(5);
  });
});
