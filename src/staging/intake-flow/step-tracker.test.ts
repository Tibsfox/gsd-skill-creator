/**
 * TDD tests for intake flow step tracker.
 *
 * Covers recordStep (write, accumulate, validate order, preserve metadata,
 * persist optional data), getResumePoint (next step, first step, flow done),
 * and readFlowState (default, persisted).
 *
 * @module staging/intake-flow/step-tracker.test
 */

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { recordStep, getResumePoint, readFlowState } from './step-tracker.js';

/** Create a temp directory and return its path. Track for cleanup. */
const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'intake-flow-'));
  tempDirs.push(dir);
  return dir;
}

/** Write a minimal valid .meta.json file. */
function writeMeta(
  path: string,
  extra?: Record<string, unknown>,
): void {
  const meta: Record<string, unknown> = {
    submitted_at: new Date().toISOString(),
    source: 'test',
    status: 'inbox',
    ...extra,
  };
  writeFileSync(path, JSON.stringify(meta, null, 2), 'utf-8');
}

/** Read and parse a .meta.json file. */
function readMeta(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

describe('recordStep', () => {
  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  // --------------------------------------------------------------------------
  // 1. recordStep writes to metadata file
  // --------------------------------------------------------------------------

  it('writes flow state to metadata file after recording a step', async () => {
    const dir = createTempDir();
    const metaPath = join(dir, 'doc.md.meta.json');
    writeMeta(metaPath);

    await recordStep('staged', metaPath);

    const meta = readMeta(metaPath);
    const flow = meta.intake_flow as Record<string, unknown>;
    expect(flow).toBeDefined();
    expect(flow.currentStep).toBe('staged');
    expect(flow.completedSteps).toEqual(['staged']);
  });

  // --------------------------------------------------------------------------
  // 2. recordStep accumulates completed steps
  // --------------------------------------------------------------------------

  it('accumulates completed steps across multiple recordings', async () => {
    const dir = createTempDir();
    const metaPath = join(dir, 'doc.md.meta.json');
    writeMeta(metaPath);

    await recordStep('staged', metaPath);
    await recordStep('hygiene', metaPath);

    const meta = readMeta(metaPath);
    const flow = meta.intake_flow as Record<string, unknown>;
    expect(flow.currentStep).toBe('hygiene');
    expect(flow.completedSteps).toEqual(['staged', 'hygiene']);
  });

  // --------------------------------------------------------------------------
  // 3. recordStep validates step order -- cannot skip steps
  // --------------------------------------------------------------------------

  it('throws when attempting to skip steps', async () => {
    const dir = createTempDir();
    const metaPath = join(dir, 'doc.md.meta.json');
    writeMeta(metaPath);

    // Try to record 'assessed' without recording 'staged' and 'hygiene' first
    await expect(recordStep('assessed', metaPath)).rejects.toThrow(/step order/i);
  });

  // --------------------------------------------------------------------------
  // 4. recordStep preserves existing metadata fields
  // --------------------------------------------------------------------------

  it('preserves existing metadata fields after recording steps', async () => {
    const dir = createTempDir();
    const metaPath = join(dir, 'doc.md.meta.json');
    const originalSubmittedAt = '2026-01-15T10:30:00Z';
    writeMeta(metaPath, {
      submitted_at: originalSubmittedAt,
      source: 'dashboard',
      status: 'checking',
      word_count: 1200,
    });

    await recordStep('staged', metaPath);

    const meta = readMeta(metaPath);
    expect(meta.submitted_at).toBe(originalSubmittedAt);
    expect(meta.source).toBe('dashboard');
    expect(meta.status).toBe('checking');
    expect(meta.word_count).toBe(1200);
  });

  // --------------------------------------------------------------------------
  // 10. recordStep stores assessment data
  // --------------------------------------------------------------------------

  it('stores assessment data when provided', async () => {
    const dir = createTempDir();
    const metaPath = join(dir, 'doc.md.meta.json');
    writeMeta(metaPath);

    await recordStep('staged', metaPath);
    await recordStep('hygiene', metaPath);
    await recordStep('assessed', metaPath, {
      assessment: { clarity: 0.85, completeness: 0.9 },
    });

    const meta = readMeta(metaPath);
    const flow = meta.intake_flow as Record<string, unknown>;
    expect(flow.assessment).toEqual({ clarity: 0.85, completeness: 0.9 });
  });

  // --------------------------------------------------------------------------
  // 11. recordStep stores hygiene summary
  // --------------------------------------------------------------------------

  it('stores hygiene report when provided', async () => {
    const dir = createTempDir();
    const metaPath = join(dir, 'doc.md.meta.json');
    writeMeta(metaPath);

    await recordStep('staged', metaPath);
    await recordStep('hygiene', metaPath, {
      hygieneReport: { overallRisk: 'low', findingCount: 2 },
    });

    const meta = readMeta(metaPath);
    const flow = meta.intake_flow as Record<string, unknown>;
    expect(flow.hygieneReport).toEqual({ overallRisk: 'low', findingCount: 2 });
  });

  // --------------------------------------------------------------------------
  // 12. recordStep stores user confirmation
  // --------------------------------------------------------------------------

  it('stores user confirmation and additional context when provided', async () => {
    const dir = createTempDir();
    const metaPath = join(dir, 'doc.md.meta.json');
    writeMeta(metaPath);

    await recordStep('staged', metaPath);
    await recordStep('hygiene', metaPath);
    await recordStep('assessed', metaPath);
    await recordStep('confirmed', metaPath, {
      userConfirmed: true,
      additionalContext: 'Please also check the examples section.',
    });

    const meta = readMeta(metaPath);
    const flow = meta.intake_flow as Record<string, unknown>;
    expect(flow.userConfirmed).toBe(true);
    expect(flow.additionalContext).toBe('Please also check the examples section.');
  });
});

describe('getResumePoint', () => {
  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  // --------------------------------------------------------------------------
  // 5. getResumePoint returns next step after last completed
  // --------------------------------------------------------------------------

  it('returns the next step after last completed', async () => {
    const dir = createTempDir();
    const metaPath = join(dir, 'doc.md.meta.json');
    writeMeta(metaPath);

    await recordStep('staged', metaPath);
    await recordStep('hygiene', metaPath);

    const resumePoint = await getResumePoint(metaPath);
    expect(resumePoint).toBe('assessed');
  });

  // --------------------------------------------------------------------------
  // 6. getResumePoint returns 'staged' when no steps recorded
  // --------------------------------------------------------------------------

  it('returns staged when no steps have been recorded', async () => {
    const dir = createTempDir();
    const metaPath = join(dir, 'doc.md.meta.json');
    writeMeta(metaPath);

    const resumePoint = await getResumePoint(metaPath);
    expect(resumePoint).toBe('staged');
  });

  // --------------------------------------------------------------------------
  // 7. getResumePoint returns null when all steps complete
  // --------------------------------------------------------------------------

  it('returns null when all steps are complete', async () => {
    const dir = createTempDir();
    const metaPath = join(dir, 'doc.md.meta.json');
    writeMeta(metaPath);

    await recordStep('staged', metaPath);
    await recordStep('hygiene', metaPath);
    await recordStep('assessed', metaPath);
    await recordStep('confirmed', metaPath);
    await recordStep('queued', metaPath);

    const resumePoint = await getResumePoint(metaPath);
    expect(resumePoint).toBeNull();
  });
});

describe('readFlowState', () => {
  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  // --------------------------------------------------------------------------
  // 8. readFlowState returns default when no flow state
  // --------------------------------------------------------------------------

  it('returns default state when no flow state exists', async () => {
    const dir = createTempDir();
    const metaPath = join(dir, 'doc.md.meta.json');
    writeMeta(metaPath);

    const state = await readFlowState(metaPath);
    expect(state).toEqual({ currentStep: 'staged', completedSteps: [] });
  });

  // --------------------------------------------------------------------------
  // 9. readFlowState parses persisted state
  // --------------------------------------------------------------------------

  it('parses persisted flow state correctly', async () => {
    const dir = createTempDir();
    const metaPath = join(dir, 'doc.md.meta.json');
    writeMeta(metaPath);

    await recordStep('staged', metaPath);
    await recordStep('hygiene', metaPath);
    await recordStep('assessed', metaPath, {
      assessment: { clarity: 0.9 },
    });

    const state = await readFlowState(metaPath);
    expect(state.currentStep).toBe('assessed');
    expect(state.completedSteps).toEqual(['staged', 'hygiene', 'assessed']);
    expect(state.assessment).toEqual({ clarity: 0.9 });
  });
});
