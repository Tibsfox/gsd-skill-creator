/**
 * finding-emitter test suite.
 *
 * Round-trip + summary checks. The emitter must be schema-stable so the
 * session-observatory can ingest reports without bespoke parsers.
 */

import { describe, expect, it } from 'vitest';

import {
  emitFinding,
  emitReport,
  parseFinding,
  parseReport,
  summarise,
} from '../finding-emitter.js';
import type { AuditFinding, AuditReport } from '../types.js';

const SAMPLE_FINDING: AuditFinding = {
  skillPath: '/tmp/example/SKILL.md',
  ruleId: 'frontmatter.name.required',
  severity: 'fail',
  message: "required frontmatter field 'name' missing or empty",
};

describe('emitFinding / parseFinding', () => {
  it('round-trips a single finding via JSON', () => {
    const json = emitFinding(SAMPLE_FINDING, () => new Date(0));
    const parsed = parseFinding(json);
    expect(parsed.schema).toBe('skilldex-auditor.finding/v1');
    expect(parsed.finding).toEqual(SAMPLE_FINDING);
    expect(parsed.emittedAt).toBe('1970-01-01T00:00:00.000Z');
  });

  it('throws on schema mismatch', () => {
    expect(() => parseFinding('{"schema":"other","finding":null}')).toThrow();
  });
});

describe('emitReport / parseReport', () => {
  it('round-trips a complete report', () => {
    const report: AuditReport = {
      timestamp: '2026-04-24T00:00:00.000Z',
      inspected: 2,
      findings: [SAMPLE_FINDING],
      disabled: false,
      summary: { pass: 0, warn: 0, fail: 1 },
    };
    const json = emitReport(report, () => new Date(0));
    const parsed = parseReport(json);
    expect(parsed.report.findings.length).toBe(1);
    expect(parsed.report.findings[0]).toEqual(SAMPLE_FINDING);
    expect(parsed.report.disabled).toBe(false);
  });

  it('throws on schema mismatch', () => {
    expect(() => parseReport('{"schema":"x"}')).toThrow();
  });
});

describe('summarise', () => {
  it('counts pass/warn/fail correctly', () => {
    const out = summarise([
      { ...SAMPLE_FINDING, severity: 'pass' },
      { ...SAMPLE_FINDING, severity: 'warn' },
      { ...SAMPLE_FINDING, severity: 'warn' },
      { ...SAMPLE_FINDING, severity: 'fail' },
    ]);
    expect(out).toEqual({ pass: 1, warn: 2, fail: 1 });
  });

  it('returns zeros on empty input', () => {
    expect(summarise([])).toEqual({ pass: 0, warn: 0, fail: 0 });
  });
});
