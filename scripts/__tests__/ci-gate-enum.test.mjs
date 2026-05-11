/**
 * Tests for scripts/ci-gate-enum.mjs (v1.49.636 C6).
 *
 * Closes Lesson #10185 by converting the SC_SKIP_CI_GATE blanket
 * override into an enumerated CSV with parser-verified test coverage.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  parseEntry,
  parseCsvOverride,
  matches,
  runGateCheck,
} from '../ci-gate-enum.mjs';

describe('parseEntry', () => {
  it('parses test-name form (fileStem:testName)', () => {
    const entry = parseEntry('v1-49-634-meta-test:C4-self-mod-guard-BLOCK');
    expect(entry).toEqual({
      type: 'test-name',
      fileStem: 'v1-49-634-meta-test',
      testName: 'C4-self-mod-guard-BLOCK',
      raw: 'v1-49-634-meta-test:C4-self-mod-guard-BLOCK',
    });
  });

  it('parses file-glob form (path:*)', () => {
    const entry = parseEntry('tests/integration/v1-49-634-meta-test.test.ts:*');
    expect(entry).toEqual({
      type: 'file-glob',
      pattern: 'tests/integration/v1-49-634-meta-test.test.ts',
      raw: 'tests/integration/v1-49-634-meta-test.test.ts:*',
    });
  });

  it('parses file-line form (path:line)', () => {
    const entry = parseEntry('tests/integration/v1-49-634-meta-test.test.ts:118');
    expect(entry).toEqual({
      type: 'file-line',
      file: 'tests/integration/v1-49-634-meta-test.test.ts',
      line: 118,
      raw: 'tests/integration/v1-49-634-meta-test.test.ts:118',
    });
  });

  it('returns null on empty / whitespace input', () => {
    expect(parseEntry('')).toBeNull();
    expect(parseEntry('   ')).toBeNull();
  });

  it('treats colon-less entries as file-glob pattern', () => {
    expect(parseEntry('SomeTestFile')).toEqual({
      type: 'file-glob',
      pattern: 'SomeTestFile',
      raw: 'SomeTestFile',
    });
  });
});

describe('parseCsvOverride', () => {
  it('parses comma-separated overrides into typed entries', () => {
    const csv =
      'v1-49-634-meta-test:C4-foo, tests/intg/file.test.ts:*, tests/intg/file.test.ts:118';
    const entries = parseCsvOverride(csv);
    expect(entries).toHaveLength(3);
    expect(entries.map((e) => e.type)).toEqual([
      'test-name',
      'file-glob',
      'file-line',
    ]);
  });

  it('returns [] for empty / missing input', () => {
    expect(parseCsvOverride('')).toEqual([]);
    expect(parseCsvOverride(undefined)).toEqual([]);
    expect(parseCsvOverride(null)).toEqual([]);
  });

  it('skips empty CSV slots (trailing commas, etc.)', () => {
    const entries = parseCsvOverride('foo:bar,,baz:*,');
    expect(entries).toHaveLength(2);
    expect(entries[0].type).toBe('test-name');
    expect(entries[1].type).toBe('file-glob');
  });
});

describe('matches', () => {
  it('test-name override matches exact fileStem:testName', () => {
    const entry = parseEntry('foo:bar');
    expect(matches('foo:bar', entry)).toBe(true);
    expect(matches('foo:baz', entry)).toBe(false);
    expect(matches('foobar:bar', entry)).toBe(false);
  });

  it('file-glob matches by stem prefix or path containment', () => {
    const entry = parseEntry('foo.test.ts:*');
    expect(matches('foo.test.ts:any-test', entry)).toBe(true);
    expect(matches('foo.test.ts:another-test', entry)).toBe(true);
    expect(matches('bar.test.ts:any-test', entry)).toBe(false);
  });

  it('file-line matches exact file:line tuple', () => {
    const entry = parseEntry('tests/foo.test.ts:42');
    expect(matches('tests/foo.test.ts:42', entry)).toBe(true);
    expect(matches('tests/foo.test.ts:43', entry)).toBe(false);
  });
});

describe('runGateCheck — end-to-end via SC_CI_GATE_FAILING', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    delete process.env.SC_CI_GATE_FAILING;
    delete process.env.SC_SKIP_CI_GATE_TESTS;
    for (const [k, v] of Object.entries(ORIGINAL_ENV)) {
      if (process.env[k] !== v) process.env[k] = v;
    }
  });

  it('returns 0 when no CI red present', () => {
    process.env.SC_CI_GATE_FAILING = '';
    const out = [];
    const rc = runGateCheck({
      log: (m) => out.push(m),
      warn: (m) => out.push(`WARN:${m}`),
      fail: (m) => out.push(`FAIL:${m}`),
    });
    expect(rc).toBe(0);
  });

  it('returns 0 when every failing test is covered by CSV', () => {
    process.env.SC_CI_GATE_FAILING = 'a:b,c:d';
    const out = [];
    const rc = runGateCheck({
      csv: 'a:b,c:d',
      log: (m) => out.push(m),
      warn: (m) => out.push(`WARN:${m}`),
      fail: (m) => out.push(`FAIL:${m}`),
    });
    expect(rc).toBe(0);
    expect(out.some((s) => s.includes('All 2 CI red(s) authorized'))).toBe(true);
  });

  it('returns 1 when an uncovered failing test exists', () => {
    process.env.SC_CI_GATE_FAILING = 'a:b,c:d';
    const out = [];
    const rc = runGateCheck({
      csv: 'a:b',
      log: (m) => out.push(m),
      warn: (m) => out.push(`WARN:${m}`),
      fail: (m) => out.push(`FAIL:${m}`),
    });
    expect(rc).toBe(1);
    expect(out.some((s) => s.includes('UNAUTHORIZED'))).toBe(true);
    expect(out.some((s) => s.includes('- c:d'))).toBe(true);
  });

  it('warns when CSV is set but CI has no failures (overrides unused)', () => {
    process.env.SC_CI_GATE_FAILING = '';
    const out = [];
    const rc = runGateCheck({
      csv: 'foo:bar',
      log: (m) => out.push(m),
      warn: (m) => out.push(`WARN:${m}`),
      fail: (m) => out.push(`FAIL:${m}`),
    });
    expect(rc).toBe(0);
    expect(out.some((s) => s.includes('WARN:') && s.includes('overrides unused'))).toBe(true);
  });

  it('emits refactor-fragile warning for file-line forms', () => {
    process.env.SC_CI_GATE_FAILING = 'a:42';
    const out = [];
    const rc = runGateCheck({
      csv: 'a:42',
      log: (m) => out.push(m),
      warn: (m) => out.push(`WARN:${m}`),
      fail: (m) => out.push(`FAIL:${m}`),
    });
    expect(rc).toBe(0);
    expect(out.some((s) => s.includes('refactor-fragile'))).toBe(true);
  });

  it('synthetic scenario: 1 failure + matching CSV -> pass', () => {
    process.env.SC_CI_GATE_FAILING =
      'v1-49-634-meta-test:C4-self-mod-guard-BLOCK';
    const rc = runGateCheck({
      csv: 'v1-49-634-meta-test:C4-self-mod-guard-BLOCK',
      log: () => {},
      warn: () => {},
      fail: () => {},
    });
    expect(rc).toBe(0);
  });

  it('synthetic scenario: 2 failures + 1 in CSV -> exit 1 listing uncovered', () => {
    process.env.SC_CI_GATE_FAILING =
      'v1-49-634-meta-test:C4-self-mod-guard-BLOCK,v1-49-635-meta-test:C6-state-md-normalizer-INVARIANT';
    const failLines = [];
    const rc = runGateCheck({
      csv: 'v1-49-634-meta-test:C4-self-mod-guard-BLOCK',
      log: () => {},
      warn: () => {},
      fail: (m) => failLines.push(m),
    });
    expect(rc).toBe(1);
    expect(
      failLines.some((s) =>
        s.includes('v1-49-635-meta-test:C6-state-md-normalizer-INVARIANT'),
      ),
    ).toBe(true);
  });
});
