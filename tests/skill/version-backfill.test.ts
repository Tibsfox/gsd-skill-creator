/**
 * Tests for version-backfill ProcessContext wire (v1.49.851).
 *
 * The pre-existing surface (parseFrontmatter, mergeFrontmatter,
 * backfillSkillContent, findSkillFiles, runBackfill) has no targeted
 * test file; these tests focus narrowly on the security wire added at
 * v1.49.851 around `gitLastModifiedDate`.
 *
 * The wire: `gitLastModifiedDate(path, ctx?)` calls `ensureProcessAllowed`
 * BEFORE the swallow-everything try/catch per Lesson #10427. Denials
 * propagate; operational failures continue to return null.
 */

import { describe, it, expect } from 'vitest';
import { gitLastModifiedDate } from '../../src/skill/version-backfill.js';
import {
  CapturingProcessAuditSink,
  ProcessContextDenied,
  type ProcessContext,
} from '../../src/security/process-context.js';

describe('gitLastModifiedDate ProcessContext wire (v1.49.851)', () => {
  it('propagates ProcessContextDenied when git is not in the allowList', () => {
    const sink = new CapturingProcessAuditSink();
    const restrictiveCtx: ProcessContext = { allowList: [], audit: sink };
    expect(() => gitLastModifiedDate('some/path.md', restrictiveCtx)).toThrow(
      ProcessContextDenied,
    );
    expect(sink.records).toHaveLength(1);
    expect(sink.records[0]?.target).toBe('git');
    expect(sink.records[0]?.allowed).toBe(false);
    // Audit record carries argv (per chokepoint contract)
    expect(sink.records[0]?.argv).toContain('log');
    expect(sink.records[0]?.argv).toContain('--format=%ai');
  });

  it('emits an allowed audit record when ctx permits git', () => {
    const sink = new CapturingProcessAuditSink();
    const permissiveCtx: ProcessContext = { allowList: ['git'], audit: sink };
    // The function may return null (path likely not git-tracked in test env)
    // OR a date string — both are valid behavior. The wire-check is that
    // ensureProcessAllowed is called and records the allowed-spawn attempt.
    gitLastModifiedDate('some/path.md', permissiveCtx);
    expect(sink.records).toHaveLength(1);
    expect(sink.records[0]?.target).toBe('git');
    expect(sink.records[0]?.allowed).toBe(true);
  });

  it('preserves backward-compat: legacy (no-ctx) calls still work', () => {
    // No ctx → ensureProcessAllowed early-returns; behavior identical to
    // pre-v851. Result is null OR a date string depending on whether the
    // test process happens to be running inside a git repo with the path
    // tracked; both are valid for the backward-compat assertion.
    const result = gitLastModifiedDate('some/nonexistent/path.md');
    expect(result === null || typeof result === 'string').toBe(true);
  });
});
