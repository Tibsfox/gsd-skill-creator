/**
 * A/B harness K-axis telemetry — JP-010a tests (Wave 2 / phase 835).
 *
 * Tests:
 *  1. Instrumentation observes a synthetic event and emits a parseable JSONL record.
 *  2. REPORT.md is created/seeded on first generateKAxisReport call (even with no log).
 *  3. REPORT.md contains a populated observation count after synthetic events.
 *  4. Log rotation: when log exceeds maxLogBytes, existing file is renamed to .1.
 *
 * All I/O is confined to tmpdir — no /media/foxy or .planning paths used in tests.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import {
  observeKAxes,
  generateKAxisReport,
  type KAxisObservation,
} from '../k-axis-telemetry.js';

// ─── Test helpers ─────────────────────────────────────────────────────────────

function tmpDir(): string {
  return join(tmpdir(), `k-axis-test-${randomUUID()}`);
}

function makeObservation(overrides?: Partial<KAxisObservation>): KAxisObservation {
  return {
    timestamp: new Date().toISOString(),
    experimentId: `exp-${randomUUID()}`,
    userDomain: 'typescript',
    expertiseLevel: 'intermediate',
    sessionType: 'interactive',
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('observeKAxes — emit', () => {
  it('emits a parseable JSONL record to the log file', async () => {
    const dir = tmpDir();
    const logPath = join(dir, 'observations.jsonl');
    const obs = makeObservation({ experimentId: 'test-exp-001', userDomain: 'python' });

    await observeKAxes({ logPath, observation: obs });

    const raw = await fs.readFile(logPath, 'utf8');
    const lines = raw.trim().split('\n').filter(Boolean);
    expect(lines).toHaveLength(1);

    const parsed = JSON.parse(lines[0]) as KAxisObservation;
    expect(parsed.experimentId).toBe('test-exp-001');
    expect(parsed.userDomain).toBe('python');
    expect(parsed.expertiseLevel).toBe('intermediate');
    expect(parsed.sessionType).toBe('interactive');
    expect(typeof parsed.timestamp).toBe('string');
  });

  it('appends multiple observations as separate JSONL lines', async () => {
    const dir = tmpDir();
    const logPath = join(dir, 'observations.jsonl');

    const obs1 = makeObservation({ userDomain: 'typescript' });
    const obs2 = makeObservation({ userDomain: 'python', expertiseLevel: 'expert' });
    const obs3 = makeObservation({ userDomain: 'rust', sessionType: 'ci' });

    await observeKAxes({ logPath, observation: obs1 });
    await observeKAxes({ logPath, observation: obs2 });
    await observeKAxes({ logPath, observation: obs3 });

    const raw = await fs.readFile(logPath, 'utf8');
    const lines = raw.trim().split('\n').filter(Boolean);
    expect(lines).toHaveLength(3);

    const parsed = lines.map(l => JSON.parse(l) as KAxisObservation);
    expect(parsed[0].userDomain).toBe('typescript');
    expect(parsed[1].userDomain).toBe('python');
    expect(parsed[2].userDomain).toBe('rust');
  });

  it('creates parent directories if they do not exist', async () => {
    const dir = tmpDir();
    const logPath = join(dir, 'nested', 'deep', 'observations.jsonl');
    const obs = makeObservation();

    await expect(observeKAxes({ logPath, observation: obs })).resolves.toBeUndefined();
    const stat = await fs.stat(logPath);
    expect(stat.isFile()).toBe(true);
  });

  it('rotates the log when it exceeds maxLogBytes', async () => {
    const dir = tmpDir();
    const logPath = join(dir, 'observations.jsonl');

    // Write a first observation to prime the file.
    const obs1 = makeObservation({ userDomain: 'seed' });
    await observeKAxes({ logPath, observation: obs1 });

    // Verify the seed file exists.
    const sizeBefore = (await fs.stat(logPath)).size;
    expect(sizeBefore).toBeGreaterThan(0);

    // Force rotation: maxLogBytes = 1 (any subsequent write triggers rotate).
    const obs2 = makeObservation({ userDomain: 'trigger-rotation' });
    await observeKAxes({ logPath, observation: obs2, maxLogBytes: 1 });

    // Original file should have been renamed to .1.
    const rotated = await fs.stat(`${logPath}.1`);
    expect(rotated.isFile()).toBe(true);

    // New log should contain only the second observation.
    const raw = await fs.readFile(logPath, 'utf8');
    const lines = raw.trim().split('\n').filter(Boolean);
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]) as KAxisObservation;
    expect(parsed.userDomain).toBe('trigger-rotation');
  });
});

describe('generateKAxisReport — REPORT.md creation', () => {
  it('creates REPORT.md even when no log file exists (seed report)', async () => {
    const dir = tmpDir();
    const logPath = join(dir, 'observations.jsonl');
    const reportPath = join(dir, 'REPORT.md');

    await generateKAxisReport({ logPath, reportPath });

    const stat = await fs.stat(reportPath);
    expect(stat.isFile()).toBe(true);

    const content = await fs.readFile(reportPath, 'utf8');
    expect(content).toContain('observed-K: pending');
    expect(content).toContain('seed');
  });

  it('creates REPORT.md with observation data after synthetic events are emitted', async () => {
    const dir = tmpDir();
    const logPath = join(dir, 'observations.jsonl');
    const reportPath = join(dir, 'REPORT.md');

    // Emit synthetic observations.
    await observeKAxes({ logPath, observation: makeObservation({ userDomain: 'typescript', expertiseLevel: 'expert' }) });
    await observeKAxes({ logPath, observation: makeObservation({ userDomain: 'python', expertiseLevel: 'beginner' }) });
    await observeKAxes({ logPath, observation: makeObservation({ userDomain: 'rust', sessionType: 'ci' }) });

    await generateKAxisReport({ logPath, reportPath });

    const content = await fs.readFile(reportPath, 'utf8');
    expect(content).toContain('observations: 3');
    expect(content).toContain('typescript');
    expect(content).toContain('python');
    expect(content).toContain('evidence-status: active');
  });

  it('creates parent directories for REPORT.md if they do not exist', async () => {
    const dir = tmpDir();
    const logPath = join(dir, 'observations.jsonl');
    const reportPath = join(dir, 'nested', 'k-axis-evidence', 'REPORT.md');

    await generateKAxisReport({ logPath, reportPath });

    const stat = await fs.stat(reportPath);
    expect(stat.isFile()).toBe(true);
  });

  it('report contains observed-K field that is parseable as a number when observations exist', async () => {
    const dir = tmpDir();
    const logPath = join(dir, 'observations.jsonl');
    const reportPath = join(dir, 'REPORT.md');

    // Two distinct domains, two distinct expertise levels, two distinct session types
    // → all 3 axes have >1 non-unknown value → observed K = 3.
    await observeKAxes({ logPath, observation: makeObservation({ userDomain: 'typescript', expertiseLevel: 'expert', sessionType: 'interactive' }) });
    await observeKAxes({ logPath, observation: makeObservation({ userDomain: 'python', expertiseLevel: 'beginner', sessionType: 'ci' }) });

    await generateKAxisReport({ logPath, reportPath });

    const content = await fs.readFile(reportPath, 'utf8');
    // Match "observed-K: <number>" in frontmatter.
    const match = content.match(/^observed-K:\s*(\d+)/m);
    expect(match).not.toBeNull();
    const k = parseInt(match![1], 10);
    expect(k).toBeGreaterThanOrEqual(1);
  });
});
