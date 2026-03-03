import { describe, it, expect } from 'vitest';
import { runOracleVerification, OracleVerifier } from './oracle-verifier.js';
import type { OracleTestCase, OracleRunConfig } from './oracle-verifier.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const identity = (...args: unknown[]) => args[0];
const broken = (..._args: unknown[]) => 'wrong-value';
const throwing = (..._args: unknown[]) => { throw new Error('impl error'); };

function make10kCases(): OracleTestCase[] {
  return Array.from({ length: 10_000 }, (_, i) => ({ inputs: [i], expected: i }));
}

function makeConfig(overrides: Partial<OracleRunConfig> = {}): OracleRunConfig {
  return {
    packageName: 'tiny-math',
    isDeterministic: true,
    ...overrides,
  };
}

// ─── runOracleVerification ─────────────────────────────────────────────────────

describe('runOracleVerification', () => {
  it('passes when 10,000 cases all match (deterministic)', () => {
    const result = runOracleVerification(identity, make10kCases(), makeConfig());
    expect(result.failures).toBe(0);
    expect(result.totalCases).toBe(10_000);
    expect(result.passedAt).not.toBeNull();
  });

  it('fails when fewer than 10,000 cases even with 0 failures (deterministic)', () => {
    const cases: OracleTestCase[] = Array.from({ length: 100 }, (_, i) => ({
      inputs: [i], expected: i,
    }));
    const result = runOracleVerification(identity, cases, makeConfig());
    expect(result.failures).toBe(0);
    expect(result.totalCases).toBe(100);
    expect(result.passedAt).toBeNull();
  });

  it('fails when any case produces wrong output', () => {
    const result = runOracleVerification(broken, make10kCases(), makeConfig());
    expect(result.failures).toBe(10_000);
    expect(result.passedAt).toBeNull();
  });

  it('fails when nativeImpl throws on a test case (counted as failure)', () => {
    const result = runOracleVerification(throwing, make10kCases(), makeConfig());
    expect(result.failures).toBe(10_000);
    expect(result.passedAt).toBeNull();
  });

  it('passedAt is ISO string when passed, null when not passed', () => {
    const passed = runOracleVerification(identity, make10kCases(), makeConfig());
    expect(typeof passed.passedAt).toBe('string');
    expect(new Date(passed.passedAt!).toISOString()).toBe(passed.passedAt);

    const failed = runOracleVerification(broken, make10kCases(), makeConfig());
    expect(failed.passedAt).toBeNull();
  });

  it('non-deterministic: passes with zero failures regardless of case count', () => {
    const cases: OracleTestCase[] = [{ inputs: [1], expected: 1 }];
    const result = runOracleVerification(identity, cases, makeConfig({ isDeterministic: false }));
    expect(result.passedAt).not.toBeNull();
    expect(result.totalCases).toBe(1);
  });

  it('non-deterministic: isDeterministic=false in result', () => {
    const result = runOracleVerification(identity, make10kCases(), makeConfig({ isDeterministic: false }));
    expect(result.isDeterministic).toBe(false);
  });

  it('failures count is cumulative (counts all mismatches, not just first)', () => {
    const cases: OracleTestCase[] = [
      { inputs: [1], expected: 1 },  // passes
      { inputs: [2], expected: 2 },  // passes
      { inputs: [3], expected: 99 }, // fails
      { inputs: [4], expected: 99 }, // fails
    ];
    const result = runOracleVerification(identity, cases, makeConfig({ minimumCases: 4 }));
    expect(result.failures).toBe(2);
  });

  it('custom minimumCases: passes at 100 cases when minimumCases=100', () => {
    const cases: OracleTestCase[] = Array.from({ length: 100 }, (_, i) => ({
      inputs: [i], expected: i,
    }));
    const result = runOracleVerification(
      identity,
      cases,
      makeConfig({ minimumCases: 100 }),
    );
    expect(result.passedAt).not.toBeNull();
    expect(result.totalCases).toBe(100);
  });

  // ─── deepEqual tests ─────────────────────────────────────────────────────────

  it('deepEqual: primitives match correctly', () => {
    const cases: OracleTestCase[] = [
      { inputs: ['hello'], expected: 'hello' },
      { inputs: [42], expected: 42 },
      { inputs: [true], expected: true },
    ];
    const result = runOracleVerification(identity, cases, makeConfig({ minimumCases: 3 }));
    expect(result.failures).toBe(0);
  });

  it('deepEqual: nested objects match correctly', () => {
    const obj = { a: { b: 1 } };
    const impl = () => ({ a: { b: 1 } });
    const cases: OracleTestCase[] = [{ inputs: [], expected: obj }];
    const result = runOracleVerification(impl, cases, makeConfig({ minimumCases: 1 }));
    expect(result.failures).toBe(0);
  });

  it('deepEqual: arrays match correctly', () => {
    const arr = [1, 2, 3];
    const impl = () => [1, 2, 3];
    const cases: OracleTestCase[] = [{ inputs: [], expected: arr }];
    const result = runOracleVerification(impl, cases, makeConfig({ minimumCases: 1 }));
    expect(result.failures).toBe(0);
  });

  it('deepEqual: null === null', () => {
    const impl = () => null;
    const cases: OracleTestCase[] = [{ inputs: [], expected: null }];
    const result = runOracleVerification(impl, cases, makeConfig({ minimumCases: 1 }));
    expect(result.failures).toBe(0);
  });

  it('deepEqual: 0 !== false', () => {
    const impl = () => 0;
    const cases: OracleTestCase[] = [{ inputs: [], expected: false }];
    const result = runOracleVerification(impl, cases, makeConfig({ minimumCases: 1 }));
    expect(result.failures).toBe(1);
  });

  // ─── Class wrapper ────────────────────────────────────────────────────────────

  it('class wrapper delegates to runOracleVerification', () => {
    const verifier = new OracleVerifier();
    const result = verifier.run(identity, make10kCases(), makeConfig());
    expect(result.failures).toBe(0);
    expect(result.passedAt).not.toBeNull();
  });
});
