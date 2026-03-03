/**
 * @file Pacing report formatter behavioral tests
 * @description Verifies formatPacingReport produces human-readable multi-line
 *              reports from PacingResult arrays with correct indicators and summaries.
 */
import { describe, expect, it } from 'vitest';
import { formatPacingReport } from '../../../src/core/validation/pacing-gate/pacing-report.js';
import type { PacingResult } from '../../../src/core/validation/pacing-gate/pacing-types.js';

function makeResult(overrides: Partial<PacingResult> = {}): PacingResult {
  return {
    status: 'pass',
    sessionId: 'session-1',
    subversionsCompleted: 3,
    budgetMax: 5,
    contextWindowsUsed: 2,
    depthMinimum: 2,
    advisories: [],
    timestamp: '2026-03-02T12:00:00.000Z',
    ...overrides,
  };
}

describe('formatPacingReport', () => {
  it('should include "Pacing Advisory Report" header', () => {
    const report = formatPacingReport([]);
    expect(report).toContain('Pacing Advisory Report');
  });

  it('should return "No pacing checks performed" for empty results array', () => {
    const report = formatPacingReport([]);
    expect(report).toContain('No pacing checks performed');
  });

  it('should show [PASS] indicator for pass results', () => {
    const report = formatPacingReport([makeResult({ status: 'pass' })]);
    expect(report).toContain('[PASS]');
  });

  it('should show [WARN] indicator for warn results', () => {
    const report = formatPacingReport([
      makeResult({
        status: 'warn',
        advisories: ['Session budget exceeded: 6/5 subversions completed'],
      }),
    ]);
    expect(report).toContain('[WARN]');
  });

  it('should include session ID in each result section', () => {
    const report = formatPacingReport([makeResult({ sessionId: 'my-session-42' })]);
    expect(report).toContain('my-session-42');
  });

  it('should include timestamp in each result section', () => {
    const report = formatPacingReport([makeResult({ timestamp: '2026-03-02T12:00:00.000Z' })]);
    expect(report).toContain('2026-03-02T12:00:00.000Z');
  });

  it('should include advisory messages indented below warn sections', () => {
    const advisory = 'Session budget exceeded: 8/5 subversions completed';
    const report = formatPacingReport([
      makeResult({ status: 'warn', advisories: [advisory] }),
    ]);
    expect(report).toContain(advisory);
  });

  it('should not include advisory messages for pass results', () => {
    const report = formatPacingReport([makeResult({ status: 'pass', advisories: [] })]);
    const lines = report.split('\n');
    const advisoryLines = lines.filter((l) => l.trim().startsWith('- '));
    expect(advisoryLines).toHaveLength(0);
  });

  it('should show overall PASS summary when all checks pass', () => {
    const report = formatPacingReport([
      makeResult({ status: 'pass' }),
      makeResult({ status: 'pass', sessionId: 'session-2' }),
    ]);
    expect(report).toContain('Overall: PASS');
    expect(report).toContain('All checks within limits');
  });

  it('should show overall WARN summary with count when warnings exist', () => {
    const report = formatPacingReport([
      makeResult({ status: 'warn', advisories: ['warning 1'] }),
      makeResult({ status: 'pass' }),
    ]);
    expect(report).toContain('Overall: WARN');
    expect(report).toContain('1 advisory warning(s) detected');
  });

  it('should count multiple warnings correctly', () => {
    const report = formatPacingReport([
      makeResult({ status: 'warn', advisories: ['warning 1'] }),
      makeResult({ status: 'warn', advisories: ['warning 2'] }),
      makeResult({ status: 'pass' }),
    ]);
    expect(report).toContain('2 advisory warning(s) detected');
  });

  it('should render multiple results in order provided', () => {
    const report = formatPacingReport([
      makeResult({ sessionId: 'first-session' }),
      makeResult({ sessionId: 'second-session' }),
    ]);
    const firstIdx = report.indexOf('first-session');
    const secondIdx = report.indexOf('second-session');
    expect(firstIdx).toBeLessThan(secondIdx);
  });

  it('should produce different output for warn vs pass result (not a constant function)', () => {
    const passReport = formatPacingReport([makeResult({ status: 'pass' })]);
    const warnReport = formatPacingReport([
      makeResult({
        status: 'warn',
        advisories: ['Context depth insufficient: 1/2 windows used'],
      }),
    ]);
    expect(passReport).not.toBe(warnReport);
  });

  it('should render a well-formed multi-line report', () => {
    const report = formatPacingReport([
      makeResult({ status: 'pass', sessionId: 'ses-A' }),
      makeResult({
        status: 'warn',
        sessionId: 'ses-B',
        advisories: ['Budget exceeded: 6/5'],
      }),
    ]);
    const lines = report.split('\n');
    expect(lines.length).toBeGreaterThan(5);
    // Should have header, separator, result sections, and summary
    expect(lines[0]).toContain('Pacing Advisory Report');
  });

  it('should include multiple advisory messages when present', () => {
    const report = formatPacingReport([
      makeResult({
        status: 'warn',
        advisories: [
          'Session budget exceeded: 6/5 subversions completed',
          'Context depth insufficient: 1/2 windows used',
        ],
      }),
    ]);
    expect(report).toContain('Session budget exceeded');
    expect(report).toContain('Context depth insufficient');
  });
});
