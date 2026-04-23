/**
 * Integration tests for the drift-audit CLI (DRIFT-26).
 *
 * Covers:
 *  1. Happy path: empty log → clean audit, exit 0, zeros in report
 *  2. Knowledge CRITICAL event → report shows it, exit 1
 *  3. Alignment CRITICAL event → report shows it, exit 1
 *  4. Retrieval CRITICAL event → report shows it, exit 1
 *  5. --format=json produces valid parseable JSON
 *  6. --since filter excludes older events
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../../');
const scriptPath = join(repoRoot, 'scripts/drift/drift-audit.mjs');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir: string;
let logsPath: string;

function setup() {
  tmpDir = join(repoRoot, `.test-tmp-drift-audit-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });
  logsPath = join(tmpDir, 'drift-telemetry.jsonl');
}

function teardown() {
  if (existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

function writeEvents(events: object[]) {
  const lines = events.map((e) => JSON.stringify(e)).join('\n');
  writeFileSync(logsPath, lines + '\n', 'utf8');
}

function runAudit(extraArgs: string[] = []): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execFileSync(
      process.execPath,
      [scriptPath, '--logs', logsPath, ...extraArgs],
      { encoding: 'utf8', cwd: repoRoot },
    );
    return { stdout, stderr: '', exitCode: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
      exitCode: err.status ?? 1,
    };
  }
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('drift-audit CLI', () => {
  beforeEach(setup);
  afterEach(teardown);

  it('happy path: empty log → exit 0 and zero counts in markdown report', () => {
    writeEvents([]);
    const { stdout, exitCode } = runAudit();

    expect(exitCode).toBe(0);
    expect(stdout).toContain('CLEAN');
    expect(stdout).toContain('0');
    // All surfaces present with zero counts
    expect(stdout).toContain('knowledge');
    expect(stdout).toContain('alignment');
    expect(stdout).toContain('retrieval');
  });

  it('knowledge critical event → exit 1 and critical count in report', () => {
    writeEvents([
      {
        type: 'drift.knowledge.detected',
        score: 0.92,
        drift_point: 2,
        confidence: 0.85,
        timestamp: '2026-04-23T10:00:00.000Z',
      },
    ]);

    const { stdout, exitCode } = runAudit();

    expect(exitCode).toBe(1);
    expect(stdout).toContain('CRITICAL');
    expect(stdout).toContain('drift.knowledge.detected');
  });

  it('alignment critical event → exit 1 and critical count in report', () => {
    writeEvents([
      {
        type: 'drift.alignment.taskDrift.detected',
        drift_magnitude: 0.91,
        classification: 'drift',
        timestamp: '2026-04-23T10:00:00.000Z',
      },
    ]);

    const { stdout, exitCode } = runAudit();

    expect(exitCode).toBe(1);
    expect(stdout).toContain('CRITICAL');
    expect(stdout).toContain('drift.alignment.taskDrift.detected');
  });

  it('retrieval context_collapse event → exit 1 and critical count in report', () => {
    writeEvents([
      {
        type: 'drift.retrieval.context_collapse_detected',
        entropy: 0.12,
        timestamp: '2026-04-23T10:00:00.000Z',
      },
    ]);

    const { stdout, exitCode } = runAudit();

    expect(exitCode).toBe(1);
    expect(stdout).toContain('CRITICAL');
    expect(stdout).toContain('drift.retrieval.context_collapse_detected');
  });

  it('--format=json produces valid parseable JSON with correct structure', () => {
    writeEvents([
      {
        type: 'drift.knowledge.detected',
        score: 0.55,
        drift_point: 1,
        confidence: 0.6,
        timestamp: '2026-04-23T10:00:00.000Z',
      },
    ]);

    const { stdout, exitCode } = runAudit(['--format', 'json']);

    // JSON must parse without error
    let parsed: any;
    expect(() => {
      parsed = JSON.parse(stdout);
    }).not.toThrow();

    expect(parsed).toHaveProperty('status');
    expect(parsed).toHaveProperty('surfaces');
    expect(parsed).toHaveProperty('total_events', 1);
    expect(parsed.surfaces).toHaveProperty('knowledge');
    expect(parsed.surfaces).toHaveProperty('alignment');
    expect(parsed.surfaces).toHaveProperty('retrieval');
    // score=0.55 → warn, not critical → exit 0
    expect(exitCode).toBe(0);
  });

  it('--since filter excludes events older than the cutoff', () => {
    writeEvents([
      {
        type: 'drift.retrieval.context_collapse_detected',
        entropy: 0.1,
        timestamp: '2026-04-20T00:00:00.000Z', // older — should be excluded
      },
      {
        type: 'drift.retrieval.stale_index_detected',
        lag_seconds: 200,
        timestamp: '2026-04-23T12:00:00.000Z', // newer — should be included
      },
    ]);

    // Filter since 2026-04-22 — only the stale_index event passes
    const { stdout, exitCode } = runAudit(['--since', '2026-04-22T00:00:00.000Z', '--format', 'json']);

    const parsed = JSON.parse(stdout);
    // context_collapse excluded → no critical → exit 0
    expect(exitCode).toBe(0);
    expect(parsed.total_events).toBe(1);
    expect(parsed.status).toBe('clean');
  });
});
