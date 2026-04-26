/**
 * A/B harness sample-budget — JP-010b tests (Wave 3 / phase 844).
 *
 * Tests:
 *  1. Θ(K/ε³) formula at canonical K=3, ε=0.1 → 3000 samples.
 *  2. Formula scales correctly with varying K and ε.
 *  3. RangeError on invalid inputs.
 *  4. parseReportFrontmatter extracts observed-K and evidence-window-days.
 *  5. resolveK uses default K=3 when evidence window < 7 days (seed report).
 *  6. resolveK uses measured K when ≥ 7 days of evidence present.
 *  7. computeSampleBudget falls back to DEFAULT_K when report file is absent.
 *  8. computeSampleBudget reads a real report file and resolves measured K.
 *
 * All file I/O uses tmpdir — no .planning paths touched.
 *
 * Reference: arXiv:2604.21923 — multicalibration sample complexity Θ(K/ε³).
 */

import { describe, it, expect } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import {
  sampleBudget,
  parseReportFrontmatter,
  resolveK,
  computeSampleBudget,
  DEFAULT_K,
  MIN_EVIDENCE_DAYS,
} from '../sample-budget.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tmpFile(name = 'REPORT.md'): string {
  return join(tmpdir(), `sample-budget-test-${randomUUID()}`, name);
}

// Seed report (no observations) — mirrors what JP-010a writes initially.
const SEED_REPORT = `---
# K-Axis Evidence Report
generated: 2026-04-26T07:52:51.806Z
observed-K: pending
evidence-status: seed — no observations recorded yet
---

# K-Axis Evidence Report

> JP-010a instrumentation is active. No observations have been recorded yet.

## Status

- **Observations recorded:** 0
- **Evidence status:** seed
- **Default K fallback:** K=3 (JP-010b gated on ≥ 7 days of evidence)
`;

// Simulated 8-day evidence report with measured K=2.
function makeEvidenceReport(observedK: number, windowDays: number): string {
  return `---
# K-Axis Evidence Report
generated: 2026-05-04T07:52:51.806Z
observed-K: ${observedK}
observations: 120
evidence-window-days: ${windowDays.toFixed(2)}
evidence-status: active
---

# K-Axis Evidence Report

> Window: ${windowDays.toFixed(2)} days | Observed K: **${observedK}**
`;
}

// ─── sampleBudget formula ─────────────────────────────────────────────────────

describe('sampleBudget — Θ(K/ε³) formula', () => {
  it('returns 3000 at canonical K=3, ε=0.1 (C=1)', () => {
    // Θ(K/ε³) = ceil(1 · 3 / 0.1³) = ceil(3 / 0.001) = ceil(3000) = 3000
    expect(sampleBudget(3, 0.1)).toBe(3000);
  });

  it('scales with K: doubling K doubles the budget', () => {
    const base = sampleBudget(3, 0.1);
    const doubled = sampleBudget(6, 0.1);
    expect(doubled).toBe(base * 2);
  });

  it('scales cubically with 1/ε: halving ε multiplies budget by 8', () => {
    const base = sampleBudget(3, 0.2);     // 3 / 0.008 = 375
    const tighter = sampleBudget(3, 0.1);  // 3 / 0.001 = 3000
    expect(tighter).toBe(base * 8);
  });

  it('applies the constant multiplier C', () => {
    const c1 = sampleBudget(3, 0.1, 1);
    const c2 = sampleBudget(3, 0.1, 2);
    expect(c2).toBe(c1 * 2);
  });

  it('returns ceil, not floor', () => {
    // K=1, ε=0.5: 1 / 0.125 = 8.0 exactly → 8
    expect(sampleBudget(1, 0.5)).toBe(8);
    // K=1, ε=0.6: 1 / 0.216 ≈ 4.63 → ceil = 5
    expect(sampleBudget(1, 0.6)).toBe(5);
  });

  it('throws RangeError for K < 1', () => {
    expect(() => sampleBudget(0, 0.1)).toThrow(RangeError);
    expect(() => sampleBudget(-1, 0.1)).toThrow(RangeError);
  });

  it('throws RangeError for epsilon ≤ 0', () => {
    expect(() => sampleBudget(3, 0)).toThrow(RangeError);
    expect(() => sampleBudget(3, -0.1)).toThrow(RangeError);
  });

  it('throws RangeError for epsilon > 1', () => {
    expect(() => sampleBudget(3, 1.1)).toThrow(RangeError);
  });

  it('accepts epsilon = 1 (maximum tolerance)', () => {
    // K=3, ε=1: ceil(3 / 1) = 3
    expect(sampleBudget(3, 1)).toBe(3);
  });
});

// ─── parseReportFrontmatter ───────────────────────────────────────────────────

describe('parseReportFrontmatter', () => {
  it('returns nulls for a seed report with observed-K: pending', () => {
    const result = parseReportFrontmatter(SEED_REPORT);
    // 'pending' is not a number → null
    expect(result.observedK).toBeNull();
    expect(result.evidenceWindowDays).toBeNull();
  });

  it('extracts observed-K and evidence-window-days from an evidence report', () => {
    const report = makeEvidenceReport(4, 8.5);
    const result = parseReportFrontmatter(report);
    expect(result.observedK).toBe(4);
    expect(result.evidenceWindowDays).toBeCloseTo(8.5, 1);
  });

  it('returns nulls when content has no frontmatter block', () => {
    const result = parseReportFrontmatter('# No frontmatter here\n\nJust prose.');
    expect(result.observedK).toBeNull();
    expect(result.evidenceWindowDays).toBeNull();
  });
});

// ─── resolveK ─────────────────────────────────────────────────────────────────

describe('resolveK', () => {
  it('defaults to K=3 for a seed report (no observations)', () => {
    const result = resolveK(SEED_REPORT);
    expect(result.K).toBe(DEFAULT_K);
    expect(result.source).toBe('default-fallback');
    expect(result.reason).toContain('no 7-day evidence window');
  });

  it('defaults to K=3 when evidence window is < 7 days', () => {
    const report = makeEvidenceReport(2, 3.0);  // only 3 days
    const result = resolveK(report);
    expect(result.K).toBe(DEFAULT_K);
    expect(result.source).toBe('default-fallback');
    expect(result.reason).toContain('< 7');
  });

  it('uses measured K when evidence window ≥ 7 days', () => {
    const report = makeEvidenceReport(2, 8.0);  // 8 days
    const result = resolveK(report);
    expect(result.K).toBe(2);
    expect(result.source).toBe('measured');
    expect(result.reason).toContain('observed-K=2');
  });

  it('uses exactly 7 days as sufficient evidence (boundary)', () => {
    const report = makeEvidenceReport(4, MIN_EVIDENCE_DAYS);
    const result = resolveK(report);
    expect(result.K).toBe(4);
    expect(result.source).toBe('measured');
  });

  it('audit-trail reason includes phase-844 date for default fallback', () => {
    const result = resolveK(SEED_REPORT);
    expect(result.reason).toContain('2026-04-26');
    expect(result.reason).toContain('FINDINGS §6 Q5');
  });
});

// ─── computeSampleBudget ─────────────────────────────────────────────────────

describe('computeSampleBudget — file-based API', () => {
  it('falls back to DEFAULT_K and computes 3000 when report file is absent', async () => {
    const path = tmpFile();
    const result = await computeSampleBudget(path, 0.1);
    expect(result.resolution.K).toBe(DEFAULT_K);
    expect(result.resolution.source).toBe('default-fallback');
    expect(result.budget).toBe(3000);
  });

  it('uses measured K from a real report file with sufficient evidence', async () => {
    const dir = join(tmpdir(), `sample-budget-test-${randomUUID()}`);
    await fs.mkdir(dir, { recursive: true });
    const path = join(dir, 'REPORT.md');
    await fs.writeFile(path, makeEvidenceReport(4, 9.0), 'utf8');

    const result = await computeSampleBudget(path, 0.1);
    expect(result.resolution.K).toBe(4);
    expect(result.resolution.source).toBe('measured');
    // ceil(4 / 0.001) = 4000
    expect(result.budget).toBe(4000);
  });

  it('defaults to K=3 for a seed report file', async () => {
    const dir = join(tmpdir(), `sample-budget-test-${randomUUID()}`);
    await fs.mkdir(dir, { recursive: true });
    const path = join(dir, 'REPORT.md');
    await fs.writeFile(path, SEED_REPORT, 'utf8');

    const result = await computeSampleBudget(path, 0.1);
    expect(result.resolution.K).toBe(DEFAULT_K);
    expect(result.budget).toBe(3000);
  });

  it('passes epsilon and constant through to the budget formula', async () => {
    const path = tmpFile();
    // K=3 default, ε=0.2, C=2: ceil(2·3 / 0.008) = ceil(750) = 750
    const result = await computeSampleBudget(path, 0.2, 2);
    expect(result.budget).toBe(750);
    expect(result.epsilon).toBe(0.2);
    expect(result.constant).toBe(2);
  });
});
