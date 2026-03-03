/**
 * Behavioral tests for the batch detection advisory verify subcommand.
 *
 * Proves that cmdVerifyBatchDetection scans .planning/phases/ for timing patterns,
 * detects timestamp clustering and session compression, and outputs a formatted
 * advisory report with advisory_only: true (never blocking).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Module under test — use project-local copy
const projectRoot = join(__dirname, '..', '..');
const verify = require(join(projectRoot, '.claude/get-shit-done/bin/lib/verify.cjs'));
const { cmdVerifyBatchDetection } = verify;

// ============================================================================
// Test fixtures
// ============================================================================

function createBatchFixture(opts: {
  summaries?: Array<{ phase: string; name: string; completed: string; duration?: string }>;
  skipPlanning?: boolean;
}): string {
  const tmpDir = mkdtempSync(join(tmpdir(), 'verify-batch-'));

  if (!opts.skipPlanning) {
    const phasesDir = join(tmpDir, '.planning', 'phases');
    mkdirSync(phasesDir, { recursive: true });

    if (opts.summaries) {
      for (const s of opts.summaries) {
        const phaseDir = join(phasesDir, `${s.phase}-${s.name}`);
        mkdirSync(phaseDir, { recursive: true });
        const summaryContent = [
          '---',
          `phase: ${s.phase}`,
          'plan: 01',
          `completed: "${s.completed}"`,
          `duration: "${s.duration || '~5min'}"`,
          '---',
          '',
          `# Phase ${s.phase} Summary`,
        ].join('\n');
        writeFileSync(join(phaseDir, `${s.phase}-01-SUMMARY.md`), summaryContent);
      }
    }
  }

  return tmpDir;
}

/** Captures JSON output by mocking process.stdout.write and process.exit */
function captureOutput(fn: () => void): any {
  let captured = '';
  const origExit = process.exit;
  const origWrite = process.stdout.write;

  process.exit = vi.fn(() => { throw new Error('EXIT_0'); }) as any;
  process.stdout.write = vi.fn((chunk: any) => {
    captured += typeof chunk === 'string' ? chunk : chunk.toString();
    return true;
  }) as any;

  try {
    fn();
  } catch (e: any) {
    if (!e.message?.includes('EXIT_0')) throw e;
  } finally {
    process.exit = origExit;
    process.stdout.write = origWrite;
  }

  try {
    return JSON.parse(captured);
  } catch {
    return captured;
  }
}

// ============================================================================
// cmdVerifyBatchDetection
// ============================================================================

describe('cmdVerifyBatchDetection', () => {
  let tmpDirs: string[] = [];

  afterEach(() => {
    for (const dir of tmpDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tmpDirs = [];
  });

  it('returns advisory_only: true -- never blocks', () => {
    const dir = createBatchFixture({
      summaries: [
        { phase: '556', name: 'foundation', completed: '2026-03-01T10:00:00Z' },
      ],
    });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyBatchDetection(dir, false);
    });

    expect(result.advisory_only).toBe(true);
  });

  it('returns pass when no suspicious timing patterns found', () => {
    const dir = createBatchFixture({
      summaries: [
        { phase: '556', name: 'foundation', completed: '2026-03-01T10:00:00Z', duration: '~10min' },
        { phase: '557', name: 'pacing', completed: '2026-03-01T14:00:00Z', duration: '~6min' },
        { phase: '558', name: 'batch', completed: '2026-03-02T09:00:00Z', duration: '~13min' },
      ],
    });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyBatchDetection(dir, false);
    });

    expect(result.overallStatus).toBe('pass');
  });

  it('detects timestamp clustering when SUMMARY.md files have close timestamps', () => {
    const dir = createBatchFixture({
      summaries: [
        { phase: '556', name: 'foundation', completed: '2026-03-01T10:00:00Z', duration: '~2min' },
        { phase: '557', name: 'pacing', completed: '2026-03-01T10:00:30Z', duration: '~2min' },
        { phase: '558', name: 'batch', completed: '2026-03-01T10:01:00Z', duration: '~2min' },
        { phase: '559', name: 'chain', completed: '2026-03-01T10:01:30Z', duration: '~2min' },
      ],
    });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyBatchDetection(dir, false);
    });

    expect(result.heuristics).toBeDefined();
    // At least one heuristic should detect a pattern
    const heuristicKeys = Object.keys(result.heuristics);
    expect(heuristicKeys.length).toBeGreaterThan(0);
    const anyDetected = heuristicKeys.some(k => result.heuristics[k].detected);
    expect(anyDetected).toBe(true);
  });

  it('each heuristic has { detected, severity, details } structure', () => {
    const dir = createBatchFixture({
      summaries: [
        { phase: '556', name: 'foundation', completed: '2026-03-01T10:00:00Z' },
      ],
    });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyBatchDetection(dir, false);
    });

    expect(result.heuristics).toBeDefined();
    for (const key of Object.keys(result.heuristics)) {
      const h = result.heuristics[key];
      expect(h).toHaveProperty('detected');
      expect(h).toHaveProperty('severity');
      expect(h).toHaveProperty('details');
    }
  });

  it('report field contains human-readable multi-line text', () => {
    const dir = createBatchFixture({
      summaries: [
        { phase: '556', name: 'foundation', completed: '2026-03-01T10:00:00Z' },
      ],
    });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyBatchDetection(dir, false);
    });

    expect(typeof result.report).toBe('string');
    expect(result.report).toContain('\n');
    expect(result.report.length).toBeGreaterThan(20);
  });

  it('handles missing .planning/ directory gracefully (error result, no crash)', () => {
    const dir = createBatchFixture({ skipPlanning: true });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyBatchDetection(dir, false);
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result.error || result.overallStatus).toBeDefined();
  });

  it('overallStatus is warn or critical when clustering detected', () => {
    const dir = createBatchFixture({
      summaries: [
        { phase: '556', name: 'a', completed: '2026-03-01T10:00:00Z', duration: '~1min' },
        { phase: '557', name: 'b', completed: '2026-03-01T10:00:10Z', duration: '~1min' },
        { phase: '558', name: 'c', completed: '2026-03-01T10:00:20Z', duration: '~1min' },
        { phase: '559', name: 'd', completed: '2026-03-01T10:00:30Z', duration: '~1min' },
        { phase: '560', name: 'e', completed: '2026-03-01T10:00:40Z', duration: '~1min' },
      ],
    });
    tmpDirs.push(dir);

    const result = captureOutput(() => {
      cmdVerifyBatchDetection(dir, false);
    });

    expect(['warn', 'critical']).toContain(result.overallStatus);
  });
});
