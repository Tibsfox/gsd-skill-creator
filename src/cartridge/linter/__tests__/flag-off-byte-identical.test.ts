/**
 * HB-05 — flag-off byte-identical invariant.
 *
 * With `cs25-26-sweep.structural-completeness-lint.enabled=false` (or
 * block absent, or file absent), the promotion gate must NOT block, and
 * any caller that does NOT consult the gate must observe exactly zero
 * side effects on the cartridge promotion pipeline.
 *
 * This linter is purely additive: with flag off, callers that don't
 * import `runPromotionGate` see byte-identical behavior to v1.49.574
 * baseline. We assert that the cartridge module barrel exports remain
 * unchanged in observable surface, and that the gate is non-blocking
 * with flag off even on a guaranteed-failure fixture.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { runPromotionGate, isStructuralCompletenessEnabled } from '../index.js';
import { withFlag, withMissingFile } from './test-helpers.js';

const FAILING_MD = '# Skill\n\nThis runs an algorithm to compute the result.';

describe('flag-off byte-identical', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('default settings (no file) → flag is off', () => {
    const env = withMissingFile();
    cleanups.push(env.cleanup);
    expect(isStructuralCompletenessEnabled(env.configPath)).toBe(false);
  });

  it('flag off + failing lint → gate.blocked === false', () => {
    const env = withFlag(false);
    cleanups.push(env.cleanup);
    const r = runPromotionGate(FAILING_MD, 'm.md', { settingsPath: env.configPath });
    expect(r.lintFailed).toBe(true);
    expect(r.blocked).toBe(false);
    expect(r.flagEnabled).toBe(false);
  });

  it('flag off + missing config → gate.blocked === false', () => {
    const env = withMissingFile();
    cleanups.push(env.cleanup);
    const r = runPromotionGate(FAILING_MD, 'm.md', { settingsPath: env.configPath });
    expect(r.blocked).toBe(false);
    expect(r.flagEnabled).toBe(false);
  });

  it('flag on + failing lint → gate.blocked === true (proves flag-off case is meaningful)', () => {
    const env = withFlag(true);
    cleanups.push(env.cleanup);
    const r = runPromotionGate(FAILING_MD, 'm.md', { settingsPath: env.configPath });
    expect(r.blocked).toBe(true);
    expect(r.flagEnabled).toBe(true);
  });

  it('cartridge promotion pipeline observable surface unchanged: linter is opt-in via promotion-gate import only', async () => {
    // Importing the existing cartridge barrel must not pull the linter
    // into the existing promotion path. This is a structural invariant —
    // we verify it by checking the existing cartridge index.ts keys.
    const cartridge = await import('../../index.js');
    const exports = Object.keys(cartridge);
    expect(exports).not.toContain('runPromotionGate');
    expect(exports).not.toContain('checkStructuralCompleteness');
  });

  it('flag-off PromotionGateResult is shape-stable across calls', () => {
    const env = withFlag(false);
    cleanups.push(env.cleanup);
    const r1 = runPromotionGate(FAILING_MD, 'm.md', { settingsPath: env.configPath });
    const r2 = runPromotionGate(FAILING_MD, 'm.md', { settingsPath: env.configPath });
    expect(r1.blocked).toBe(r2.blocked);
    expect(r1.lintFailed).toBe(r2.lintFailed);
    expect(r1.flagEnabled).toBe(r2.flagEnabled);
    expect(r1.lintResult.overallScore).toBe(r2.lintResult.overallScore);
    expect(r1.warnings).toEqual(r2.warnings);
  });
});
