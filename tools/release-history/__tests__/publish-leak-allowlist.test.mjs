/**
 * publish.mjs — leak-scan false-positive allowlist (AC7 fix, v1.49.916).
 *
 * The publish leak-scan is a HARD security gate: any forbidden pattern blocks
 * that file. v916 adds a NARROW, auditable allowlist for documented
 * self-referential false positives (a doc that NAMES a leak pattern while
 * documenting the leak-hardening itself — e.g. v588/03-retrospective.md trips
 * the bare `fox-companies` pattern by quoting the regex it describes).
 *
 * These tests pin the security posture: an excuse requires an EXACT
 * version+file+pattern match; a real leak in any other file, a new pattern in
 * the same file, or the same pattern in another release still BLOCKS. The
 * gate logic (leakScan) is dependency-injectable so it is tested without config
 * coupling; one test also asserts the REAL committed allowlist excuses the
 * known v588 case (regression guard for the specific false positive).
 */
import { describe, it, expect } from 'vitest';
import { leakScan, leakAllowlistExcuses } from '../publish.mjs';
import { loadConfig } from '../config.mjs';

const PAT = [/fox-companies/];
const LINE = 'documents the narrowed .planning/(fox-companies|agent-memory)/ regex';

describe('leakAllowlistExcuses — exact-triple matching', () => {
  const allow = [{ version: 'v1.0.0', file: 'a.md', pattern: 'fox-companies', reason: 'doc' }];

  it('excuses on an exact version+file+pattern match', () => {
    expect(leakAllowlistExcuses(allow, 'v1.0.0', 'a.md', 'fox-companies')).toBe(true);
  });
  it('does NOT excuse a different file (narrow by design)', () => {
    expect(leakAllowlistExcuses(allow, 'v1.0.0', 'b.md', 'fox-companies')).toBe(false);
  });
  it('does NOT excuse a different version', () => {
    expect(leakAllowlistExcuses(allow, 'v2.0.0', 'a.md', 'fox-companies')).toBe(false);
  });
  it('does NOT excuse a different pattern', () => {
    expect(leakAllowlistExcuses(allow, 'v1.0.0', 'a.md', 'PGPASSWORD')).toBe(false);
  });
  it('an empty / missing allowlist excuses nothing', () => {
    expect(leakAllowlistExcuses([], 'v1.0.0', 'a.md', 'fox-companies')).toBe(false);
    expect(leakAllowlistExcuses(undefined, 'v1.0.0', 'a.md', 'fox-companies')).toBe(false);
  });
});

describe('leakScan — allowlist applied to real scanning', () => {
  it('blocks a matching line with no allowlist', () => {
    const v = leakScan(LINE, { version: 'v1.49.588', file: '03-retrospective.md', patterns: PAT, allowlist: [] });
    expect(v).toHaveLength(1);
    expect(v[0].pattern).toBe('fox-companies');
  });

  it('excuses the matching line when the exact triple is allowlisted', () => {
    const allow = [{ version: 'v1.49.588', file: '03-retrospective.md', pattern: 'fox-companies' }];
    const v = leakScan(LINE, { version: 'v1.49.588', file: '03-retrospective.md', patterns: PAT, allowlist: allow });
    expect(v).toHaveLength(0);
  });

  it('still blocks the same content in a DIFFERENT file (security: allowlist is per-file)', () => {
    const allow = [{ version: 'v1.49.588', file: '03-retrospective.md', pattern: 'fox-companies' }];
    const v = leakScan(LINE, { version: 'v1.49.588', file: '00-summary.md', patterns: PAT, allowlist: allow });
    expect(v).toHaveLength(1);
  });

  it('still blocks a DIFFERENT pattern in the same allowlisted file', () => {
    const allow = [{ version: 'v1.49.588', file: '03-retrospective.md', pattern: 'fox-companies' }];
    const v = leakScan('contains maple@tibsfox somewhere', {
      version: 'v1.49.588', file: '03-retrospective.md', patterns: [/maple@tibsfox/], allowlist: allow,
    });
    expect(v).toHaveLength(1);
  });
});

describe('real committed config — the v588 false positive is allowlisted', () => {
  it('the base config excuses v1.49.588/03-retrospective.md for the fox-companies pattern', () => {
    const cfg = loadConfig(true);
    expect(Array.isArray(cfg.leak_scan_allowlist)).toBe(true);
    expect(leakAllowlistExcuses(cfg.leak_scan_allowlist, 'v1.49.588', '03-retrospective.md', 'fox-companies')).toBe(true);
  });
  it('every allowlist entry carries a non-empty reason (auditability)', () => {
    const cfg = loadConfig(true);
    for (const e of cfg.leak_scan_allowlist || []) {
      expect(typeof e.reason).toBe('string');
      expect(e.reason.length).toBeGreaterThan(10);
    }
  });
});
