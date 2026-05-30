/**
 * refresh.mjs — isAdvisoryExit: advisory vs fatal step-exit classification.
 *
 * Authored v1.49.916 (tool-robustness ship). The refresh pipeline runner treats
 * a step's non-zero exit as a failure that aborts the pipeline. Two step exits
 * are ADVISORY (a reported condition, not a failure) and must NOT abort:
 *   - scan        exit 2 (filesystem-vs-RELEASE-HISTORY drift, expected in flight)
 *   - drift-check exit 1 (quality drift; advisory per scripts/release-history-
 *                 refresh.sh's documented "1 = drift-check warned" contract)
 *
 * Before v1.49.916, only scan's exit-2 was special-cased; drift-check's by-design
 * exit-1 aborted the pipeline BEFORE the final `audit` step and reported overall
 * FAIL on every drift — the friction the v915 handoff misattributed to a
 * "PG-credential bug". drift-check exit 2 (a fatal crash, e.g. unresolved PG
 * credentials) stays fatal.
 *
 * importing refresh.mjs runs no pipeline (v1.49.916 entrypoint guard), so this
 * test imports the pure classifier directly.
 */
import { describe, it, expect } from 'vitest';
import { isAdvisoryExit } from '../refresh.mjs';

describe('refresh isAdvisoryExit — advisory vs fatal step-exit classification', () => {
  it('scan exit 2 is advisory (filesystem drift, expected in flight)', () => {
    expect(isAdvisoryExit('scan', 2)).toBe(true);
  });

  it('drift-check exit 1 is advisory (quality drift; advisory per release-history-refresh.sh)', () => {
    expect(isAdvisoryExit('drift-check', 1)).toBe(true);
  });

  it('drift-check exit 2 is NOT advisory (fatal crash, e.g. missing PG creds, stays fatal)', () => {
    expect(isAdvisoryExit('drift-check', 2)).toBe(false);
  });

  it('scan exit 1 is NOT advisory (only the documented exit-2 drift code)', () => {
    expect(isAdvisoryExit('scan', 1)).toBe(false);
  });

  it('a real step failure (audit exit 1) is NOT advisory', () => {
    expect(isAdvisoryExit('audit', 1)).toBe(false);
  });

  it('unrelated steps are never advisory regardless of exit code', () => {
    expect(isAdvisoryExit('ingest', 1)).toBe(false);
    expect(isAdvisoryExit('chapter', 2)).toBe(false);
    expect(isAdvisoryExit('regen-history-md', 1)).toBe(false);
  });

  it('exit 0 is never classified as an advisory non-zero (it is plain success)', () => {
    expect(isAdvisoryExit('scan', 0)).toBe(false);
    expect(isAdvisoryExit('drift-check', 0)).toBe(false);
  });
});
