/**
 * v1.49.841 — classify-types chip detection
 *
 * Asserts that chip-class ships (codification, KNOWN_UNWIRED chip,
 * scaffold, stale-entry cleanup, wedge close, audit inverse-check,
 * atomic-writer) are classified as `chip`, while substantive
 * features stay `feature`, NASA degrees stay `degree`, and
 * Gastown-style "Chipset" releases are NOT misclassified.
 *
 * Lives at tools/release-history/__tests__/ which is outside the
 * current vitest include glob; forward-ready when scope widens.
 */
import { describe, it, expect } from 'vitest';
import { classify } from '../classify-types.mjs';

function rel(name, opts = {}) {
  return { name, semver_patch: opts.semver_patch ?? 1, ...opts };
}

describe('v1.49.841: chip classification', () => {
  it('classifies "Codification Ship" titles as chip', () => {
    const r = classify(rel('Codification Ship: Promote #10436 + #10437'));
    expect(r.type).toBe('chip');
  });

  it('classifies "Codify ... as Discipline" titles as chip', () => {
    const r = classify(rel('Codify Cross-Rootdir Wire Pattern as Discipline'));
    expect(r.type).toBe('chip');
  });

  it('classifies "Batch Chip" titles as chip', () => {
    const r = classify(rel('Batch Chip: `git/core` Family ProcessContext'));
    expect(r.type).toBe('chip');
  });

  it('classifies "First ProcessContext Chip" titles as chip', () => {
    const r = classify(rel('First ProcessContext Chip: intelligence/analyzer/git.ts'));
    expect(r.type).toBe('chip');
  });

  it('classifies "Singleton Chip" titles as chip', () => {
    const r = classify(rel('ProcessContext Singleton Chip: stalled.ts'));
    expect(r.type).toBe('chip');
  });

  it('classifies "Stale-Entry Cleanup" titles as chip', () => {
    const r = classify(rel('ProcessContext Stale-Entry Cleanup (intelligence/analyzer/git.ts)'));
    expect(r.type).toBe('chip');
  });

  it('classifies "Wedge Close" titles as chip', () => {
    const r = classify(rel('T2.3 Wedge Close: PMTiles Refcounted Archive Close'));
    expect(r.type).toBe('chip');
  });

  it('classifies "Calibration Scaffold" titles as chip', () => {
    const r = classify(rel('`lowConfidenceThreshold` Calibration Scaffold (Full)'));
    expect(r.type).toBe('chip');
  });

  it('classifies "Inverse-Check" titles as chip', () => {
    const r = classify(rel('Audit Inverse-Check (Stale-Entry Detector)'));
    expect(r.type).toBe('chip');
  });

  it('classifies "Atomic Writer Tool" titles as chip', () => {
    const r = classify(rel('Post-T14-reset STATE.md Drift Closure: Atomic Writer Tool'));
    expect(r.type).toBe('chip');
  });

  it('does NOT misclassify "Chipset" titles as chip', () => {
    const r = classify(rel('Gastown Chipset Integration'));
    expect(r.type).not.toBe('chip');
  });

  it('does NOT classify substantive features as chip', () => {
    expect(classify(rel('T1.1 Ship 6: Bounded-Learning `--watch` Mode')).type).toBe('feature');
    expect(classify(rel('Real Token-Budget Observation Source')).type).toBe('feature');
    expect(classify(rel('T1.3 Option A: gnn-predictor Wired Into Copper Activation')).type).toBe('feature');
    expect(classify(rel('publish.mjs Destination-Side Hand-Author Preservation')).type).toBe('feature');
  });

  it('NASA degrees beat chip classification when both signals present', () => {
    const readme = '# v1.X — Mission Name\n\n**Part A:** foo\n\n**Part B:** bar\n';
    const r = classify(rel('Mission Name'), readme);
    expect(r.type).toBe('degree');
  });

  it('milestone markers beat chip classification', () => {
    const r = classify(rel('Milestone Complete: Foo Shipped'));
    expect(r.type).toBe('milestone');
  });

  it('patch markers beat chip classification', () => {
    const r = classify(rel('Hotfix: Chip-related bug'));
    expect(r.type).toBe('patch');
  });
});
